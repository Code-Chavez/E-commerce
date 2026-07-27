import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '@infrastructure/database/prisma';
import bcrypt from 'bcrypt';
import { PrismaEmployeeRepository } from '@infrastructure/database/repositories/PrismaEmployeeRepository';
import { PrismaRoleRepository } from '@infrastructure/database/repositories/PrismaRoleRepository';

import { dniSchema } from '@shared/validation/documentValidators';

const employeeRepository = new PrismaEmployeeRepository();
const roleRepository = new PrismaRoleRepository();

const CreateEmployeeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  dni: dniSchema,
  branchId: z.number().positive('Sucursal requerida'),
  userId: z.number().optional().nullable(),
  roleId: z.number().optional().nullable(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  password: z
    .string()
    .min(6, 'Contraseña muy corta')
    .optional()
    .or(z.literal('')),
});

const UpdateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  dni: dniSchema.optional(),
  branchId: z.number().positive().optional(),
  roleId: z.number().optional().nullable(),
});

const ToggleStatusSchema = z.object({
  isActive: z.boolean(),
});

export class EmployeeController {
  async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(String(req.query.page || '1'), 10);
      const limit = parseInt(String(req.query.limit || '10'), 10);
      const search = req.query.search as string;

      const data = await employeeRepository.findAll({ page, limit, search });
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = CreateEmployeeSchema.safeParse(req.body);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, error: validation.error.issues });
      }

      const { roleId, email, password, ...employeeData } = validation.data;

      const existing = await employeeRepository.findByDni(employeeData.dni);
      if (existing) {
        return res
          .status(400)
          .json({ success: false, error: 'El DNI ya está registrado' });
      }

      // Si se proporciona email y password, creamos el usuario primero
      let userId = employeeData.userId;
      if (email && password && !userId) {
        // Verificar si el email ya existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: 'El email ya está registrado en otra cuenta',
          });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: employeeData.name,
            isActive: true,
          },
        });
        userId = newUser.id;
      }

      // Si se selecciona un rol pero no se proporciona ni se crea userId, informamos el error lógico
      if (roleId && !userId) {
        return res.status(400).json({
          success: false,
          error:
            'No se puede asignar un rol a un empleado que no tiene una cuenta de usuario vinculada.',
        });
      }

      const employee = await employeeRepository.create({
        ...employeeData,
        userId,
      });

      // Sincronización de roles (Solo si tiene userId)
      if (employee.userId) {
        if (roleId) {
          await roleRepository.assignRoleToUser(employee.userId, roleId);
        } else {
          await roleRepository.clearUserRoles(employee.userId);
        }
      }

      return res.status(201).json({ success: true, data: employee });
    } catch (error: any) {
      next(error);
    }
  }

  async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const validation = UpdateEmployeeSchema.safeParse(req.body);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, error: validation.error.issues });
      }

      const { roleId, ...updateData } = validation.data;
      const employee = await employeeRepository.update(id, updateData);

      // Sincronización de roles (Solo si tiene userId vinculado)
      if (employee.userId) {
        if (roleId) {
          await roleRepository.assignRoleToUser(employee.userId, roleId);
        } else {
          await roleRepository.clearUserRoles(employee.userId);
        }
      }

      return res.status(200).json({ success: true, data: employee });
    } catch (error: any) {
      next(error);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const validation = ToggleStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, error: validation.error.issues });
      }

      await employeeRepository.toggleStatus(id, validation.data.isActive);
      return res
        .status(200)
        .json({ success: true, message: 'Estado actualizado' });
    } catch (error: any) {
      next(error);
    }
  }
}
