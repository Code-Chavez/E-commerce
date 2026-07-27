import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaInventoryAuditRepository } from '@infrastructure/database/repositories/PrismaInventoryAuditRepository';
import { CreateInventoryAuditUseCase } from '@application/use-cases/inventory/CreateInventoryAuditUseCase';

// DI Manual
const inventoryAuditRepository = new PrismaInventoryAuditRepository();
const createInventoryAuditUseCase = new CreateInventoryAuditUseCase(inventoryAuditRepository);

// Schemas de Zod
const AuditItemRequestSchema = z.object({
  variantId: z.number().int().positive('El ID de variante debe ser un entero positivo'),
  physicalQty: z.number().nonnegative('La cantidad física no puede ser negativa'),
});

const CreateInventoryAuditSchema = z.object({
  branchId: z.number().int().positive('El ID de sucursal debe ser un entero positivo'),
  status: z.enum(['PENDING', 'CONFIRMED']),
  items: z.array(AuditItemRequestSchema).min(1, 'La auditoría debe contener al menos un ítem'),
});

const mapZodErrors = (issues: z.ZodIssue[]) =>
  issues.map((err) => ({ field: err.path.join('.'), message: err.message }));

export class InventoryAuditController {
  /**
   * POST /api/v1/inventory-audits
   *
   * Registra un conteo físico o auditoría de inventario.
   * Calcula automáticamente las diferencias.
   * Si es CONFIRMED, actualiza BranchStock y genera Kardex AJUSTE.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = CreateInventoryAuditSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, errors: mapZodErrors(validation.error.issues) });
      }

      const result = await createInventoryAuditUseCase.execute(validation.data);
      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message?.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}
