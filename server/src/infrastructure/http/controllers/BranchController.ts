import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaBranchRepository } from '@infrastructure/database/repositories/PrismaBranchRepository';
import { CreateBranchUseCase } from '@application/use-cases/branch/CreateBranchUseCase';
import { UpdateBranchUseCase } from '@application/use-cases/branch/UpdateBranchUseCase';
import { ToggleBranchStatusUseCase } from '@application/use-cases/branch/ToggleBranchStatusUseCase';

const branchRepository = new PrismaBranchRepository();
const createBranchUseCase = new CreateBranchUseCase(branchRepository);
const updateBranchUseCase = new UpdateBranchUseCase(branchRepository);
const toggleBranchStatusUseCase = new ToggleBranchStatusUseCase(branchRepository);

// Schemas de Validación con Zod
const CreateBranchSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  address: z.string().max(255, 'La dirección no puede exceder 255 caracteres').optional(),
  phone: z.string().max(20, 'El teléfono no puede exceder 20 caracteres').optional(),
  isMain: z.boolean().optional(),
  igvExempt: z.boolean().optional(),
});

const UpdateBranchSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  address: z.string().max(255, 'La dirección no puede exceder 255 caracteres').optional().nullable(),
  phone: z.string().max(20, 'El teléfono no puede exceder 20 caracteres').optional().nullable(),
  isMain: z.boolean().optional(),
  igvExempt: z.boolean().optional(),
});

const ToggleStatusSchema = z.object({
  isActive: z.boolean(),
});

export class BranchController {
  /**
   * GET /api/v1/branches
   * Obtiene todas las sucursales (Mantiene retrocompatibilidad agregando el almacén asociado)
   */
  async getBranches(_req: Request, res: Response, next: NextFunction) {
    try {
      const branches = await branchRepository.findAll();
      return res.status(200).json({ success: true, data: branches });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/branches
   * Crea una nueva sucursal y autogenera su almacén 1:1 en una transacción
   */
  async createBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = CreateBranchSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const branch = await createBranchUseCase.execute(validation.data);
      return res.status(201).json({ success: true, data: branch });
    } catch (error: any) {
      if (error.message.includes('ya está registrado')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * PUT /api/v1/branches/:id
   * Edita los campos de una sucursal
   */
  async updateBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID de sucursal inválido' });
      }

      const validation = UpdateBranchSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const branch = await updateBranchUseCase.execute(id, validation.data);
      return res.status(200).json({ success: true, data: branch });
    } catch (error: any) {
      if (error.message.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message.includes('ya está registrado')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/v1/branches/:id/status
   * Cambia el estado isActive de una sucursal
   */
  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID de sucursal inválido' });
      }

      const validation = ToggleStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const branch = await toggleBranchStatusUseCase.execute(id, validation.data.isActive);
      return res.status(200).json({
        success: true,
        message: `Sucursal ${validation.data.isActive ? 'activada' : 'inactivada'} correctamente`,
        data: branch,
      });
    } catch (error: any) {
      if (error.message.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}
