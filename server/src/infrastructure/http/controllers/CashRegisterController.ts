import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaCashRegisterRepository } from '@infrastructure/database/repositories/PrismaCashRegisterRepository';
import { CreateCashRegisterUseCase } from '@application/use-cases/pos/CreateCashRegisterUseCase';
import { GetAllCashRegistersUseCase } from '@application/use-cases/pos/GetAllCashRegistersUseCase';
import { UpdateCashRegisterUseCase } from '@application/use-cases/pos/UpdateCashRegisterUseCase';
import { DeleteCashRegisterUseCase } from '@application/use-cases/pos/DeleteCashRegisterUseCase';

import prisma from '@infrastructure/database/prisma';

const cashRegisterRepository = new PrismaCashRegisterRepository();
const createUseCase = new CreateCashRegisterUseCase(cashRegisterRepository);
const getAllUseCase = new GetAllCashRegistersUseCase(cashRegisterRepository);
const updateUseCase = new UpdateCashRegisterUseCase(cashRegisterRepository);
const deleteUseCase = new DeleteCashRegisterUseCase(cashRegisterRepository);

const CreateCashRegisterSchema = z.object({
  branchId: z.number().int().positive('El ID de la sucursal debe ser un entero positivo'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100, 'El nombre debe tener un máximo de 100 caracteres'),
});

const UpdateCashRegisterSchema = z.object({
  branchId: z.number().int().positive('El ID de la sucursal debe ser un entero positivo').optional(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100, 'El nombre debe tener un máximo de 100 caracteres').optional(),
});

const mapZodErrors = (issues: z.ZodIssue[]) =>
  issues.map((err) => ({ field: err.path.join('.'), message: err.message }));

export class CashRegisterController {
  /**
   * POST /api/v1/cash-registers
   * Crea una caja registradora. Solo ADMIN.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.auth?.role;
      if (role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado: Solo el Administrador está autorizado para crear cajas registradoras',
        });
      }

      const validation = CreateCashRegisterSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, errors: mapZodErrors(validation.error.issues) });
      }

      const result = await createUseCase.execute(validation.data);
      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message?.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message?.includes('inactiva')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/cash-registers
   * Lista todas las cajas registradoras activas. ADMIN o SELLER.
   * Si se provee ?branchId=..., filtra por sucursal.
   */
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.auth?.role;
      if (role !== 'ADMIN' && role !== 'SELLER') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado: Permisos insuficientes para listar cajas registradoras',
        });
      }

      const branchIdStr = req.query.branchId;
      if (branchIdStr !== undefined) {
        const branchId = parseInt(String(branchIdStr), 10);
        if (isNaN(branchId)) {
          return res.status(400).json({ success: false, error: 'El parámetro branchId debe ser un número entero' });
        }
        const records = await prisma.cashRegister.findMany({
          where: { branchId, isActive: true },
          orderBy: { name: 'asc' },
        });
        return res.status(200).json({ success: true, data: records });
      }

      const result = await getAllUseCase.execute();
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/cash-registers/:id
   * Edita una caja registradora. Solo ADMIN.
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.auth?.role;
      if (role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado: Solo el Administrador está autorizado para actualizar cajas registradoras',
        });
      }

      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'El ID de la caja registradora debe ser un número entero' });
      }

      const validation = UpdateCashRegisterSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, errors: mapZodErrors(validation.error.issues) });
      }

      const result = await updateUseCase.execute(id, validation.data);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message?.includes('no existe') || error.message?.includes('eliminada')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message?.includes('inactiva')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/cash-registers/:id
   * Elimina lógicamente una caja registradora. Solo ADMIN.
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.auth?.role;
      if (role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado: Solo el Administrador está autorizado para eliminar cajas registradoras',
        });
      }

      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'El ID de la caja registradora debe ser un número entero' });
      }

      await deleteUseCase.execute(id);
      return res.status(200).json({
        success: true,
        message: 'Caja registradora eliminada lógicamente con éxito',
      });
    } catch (error: any) {
      if (error.statusCode === 409) {
        return res.status(409).json({ success: false, error: error.message });
      }
      if (error.message?.includes('no existe') || error.message?.includes('eliminada')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}
