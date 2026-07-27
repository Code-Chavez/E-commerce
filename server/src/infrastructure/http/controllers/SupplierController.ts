// ─── HU-051 T-090: Controller REST de Proveedores ────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaSupplierRepository } from '@infrastructure/database/repositories/PrismaSupplierRepository';
import { GetAllSuppliersUseCase } from '@application/use-cases/supplier/GetAllSuppliersUseCase';
import { CreateSupplierUseCase } from '@application/use-cases/supplier/CreateSupplierUseCase';
import { UpdateSupplierUseCase } from '@application/use-cases/supplier/UpdateSupplierUseCase';
import { ToggleSupplierStatusUseCase } from '@application/use-cases/supplier/ToggleSupplierStatusUseCase';

import { rucSchema } from '@shared/validation/documentValidators';

// ── Composición de dependencias (DI manual — Dependency Inversion) ────────────
const supplierRepository = new PrismaSupplierRepository();
const getAllSuppliersUseCase = new GetAllSuppliersUseCase(supplierRepository);
const createSupplierUseCase = new CreateSupplierUseCase(supplierRepository);
const updateSupplierUseCase = new UpdateSupplierUseCase(supplierRepository);
const toggleSupplierStatusUseCase = new ToggleSupplierStatusUseCase(
  supplierRepository
);

// ── Schemas de validación Zod ─────────────────────────────────────────────────
const CreateSupplierSchema = z.object({
  ruc: rucSchema,
  razonSocial: z
    .string()
    .min(2, 'La razón social debe tener al menos 2 caracteres')
    .max(200, 'La razón social no puede exceder 200 caracteres'),
  contacto: z
    .string()
    .min(2, 'El contacto debe tener al menos 2 caracteres')
    .max(100, 'El contacto no puede exceder 100 caracteres'),
  rubro: z
    .string()
    .min(2, 'El rubro debe tener al menos 2 caracteres')
    .max(100, 'El rubro no puede exceder 100 caracteres'),
  direccion: z
    .string()
    .max(255, 'La dirección no puede exceder 255 caracteres')
    .optional()
    .nullable(),
});

const UpdateSupplierSchema = z.object({
  ruc: rucSchema.optional(),
  razonSocial: z
    .string()
    .min(2, 'La razón social debe tener al menos 2 caracteres')
    .max(200, 'La razón social no puede exceder 200 caracteres')
    .optional(),
  contacto: z
    .string()
    .min(2, 'El contacto debe tener al menos 2 caracteres')
    .max(100, 'El contacto no puede exceder 100 caracteres')
    .optional(),
  rubro: z
    .string()
    .min(2, 'El rubro debe tener al menos 2 caracteres')
    .max(100, 'El rubro no puede exceder 100 caracteres')
    .optional(),
  direccion: z
    .string()
    .max(255, 'La dirección no puede exceder 255 caracteres')
    .optional()
    .nullable(),
});

const ToggleStatusSchema = z.object({
  isActive: z.boolean(),
});

// ── Utilidad DRY: parsear errores Zod ────────────────────────────────────────
const mapZodErrors = (issues: z.ZodIssue[]) =>
  issues.map((err) => ({ field: err.path.join('.'), message: err.message }));

export class SupplierController {
  /**
   * GET /api/v1/suppliers
   * Obtiene el listado completo de proveedores
   */
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await getAllSuppliersUseCase.execute();
      return res.status(200).json({ success: true, data: suppliers });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/suppliers
   * Registra un nuevo proveedor
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = CreateSupplierSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: mapZodErrors(validation.error.issues),
        });
      }

      const supplier = await createSupplierUseCase.execute(validation.data);
      return res.status(201).json({ success: true, data: supplier });
    } catch (error: any) {
      if (error.message?.includes('ya se encuentra registrado')) {
        return res.status(409).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * PUT /api/v1/suppliers/:id
   * Actualiza los datos de un proveedor
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, error: 'ID de proveedor inválido' });
      }

      const validation = UpdateSupplierSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: mapZodErrors(validation.error.issues),
        });
      }

      const supplier = await updateSupplierUseCase.execute(id, validation.data);
      return res.status(200).json({ success: true, data: supplier });
    } catch (error: any) {
      if (error.message?.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message?.includes('ya se encuentra registrado')) {
        return res.status(409).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/v1/suppliers/:id/status
   * Activa o inactiva un proveedor (baja lógica)
   */
  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, error: 'ID de proveedor inválido' });
      }

      const validation = ToggleStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: mapZodErrors(validation.error.issues),
        });
      }

      const supplier = await toggleSupplierStatusUseCase.execute(
        id,
        validation.data.isActive
      );
      return res.status(200).json({
        success: true,
        message: `Proveedor ${validation.data.isActive ? 'activado' : 'inactivado'} correctamente`,
        data: supplier,
      });
    } catch (error: any) {
      if (error.message?.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}
