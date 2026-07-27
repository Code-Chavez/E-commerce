import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaAddressRepository } from '@infrastructure/database/repositories/PrismaAddressRepository';
import { CreateAddressUseCase } from '@application/use-cases/address/CreateAddressUseCase';
import { UpdateAddressUseCase } from '@application/use-cases/address/UpdateAddressUseCase';
import { DeleteAddressUseCase } from '@application/use-cases/address/DeleteAddressUseCase';
import { GetUserAddressesUseCase } from '@application/use-cases/address/GetUserAddressesUseCase';

const addressRepository = new PrismaAddressRepository();
const createAddressUseCase = new CreateAddressUseCase(addressRepository);
const updateAddressUseCase = new UpdateAddressUseCase(addressRepository);
const deleteAddressUseCase = new DeleteAddressUseCase(addressRepository);
const getUserAddressesUseCase = new GetUserAddressesUseCase(addressRepository);

const CreateAddressSchema = z.object({
  alias: z.string().min(2, 'El alias debe tener al menos 2 caracteres').max(50),
  fullAddress: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  district: z.string().min(2, 'El distrito debe tener al menos 2 caracteres'),
  reference: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});

const UpdateAddressSchema = z.object({
  alias: z.string().min(2, 'El alias debe tener al menos 2 caracteres').max(50).optional(),
  fullAddress: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').optional(),
  district: z.string().min(2, 'El distrito debe tener al menos 2 caracteres').optional(),
  reference: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});

export class AddressController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Acceso no autorizado: Contexto de seguridad faltante',
        });
      }

      const addresses = await getUserAddressesUseCase.execute(userId);
      return res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Acceso no autorizado: Contexto de seguridad faltante',
        });
      }

      const validation = CreateAddressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const address = await createAddressUseCase.execute(userId, validation.data);
      return res.status(201).json({
        success: true,
        message: 'Dirección creada correctamente',
        data: address,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Acceso no autorizado: Contexto de seguridad faltante',
        });
      }

      const addressId = parseInt(String(req.params.id), 10);
      if (isNaN(addressId)) {
        return res.status(400).json({
          success: false,
          error: 'ID de dirección inválido',
        });
      }

      const validation = UpdateAddressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const address = await updateAddressUseCase.execute(userId, addressId, validation.data);
      return res.status(200).json({
        success: true,
        message: 'Dirección actualizada correctamente',
        data: address,
      });
    } catch (error: any) {
      if (error.message === 'Dirección no encontrada') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Acceso no autorizado: Contexto de seguridad faltante',
        });
      }

      const addressId = parseInt(String(req.params.id), 10);
      if (isNaN(addressId)) {
        return res.status(400).json({
          success: false,
          error: 'ID de dirección inválido',
        });
      }

      await deleteAddressUseCase.execute(userId, addressId);
      return res.status(200).json({
        success: true,
        message: 'Dirección eliminada correctamente',
      });
    } catch (error: any) {
      if (error.message === 'Dirección no encontrada') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}
