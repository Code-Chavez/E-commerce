// ─── HU-051 T-091: Controller REST de Ingreso de Mercadería ──────────────────

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaStockEntryRepository } from '@infrastructure/database/repositories/PrismaStockEntryRepository';
import { PrismaSupplierRepository } from '@infrastructure/database/repositories/PrismaSupplierRepository';
import { CreateStockEntryUseCase } from '@application/use-cases/inventory/CreateStockEntryUseCase';

// ── Composición de dependencias (DI manual — Dependency Inversion) ────────────
const stockEntryRepository = new PrismaStockEntryRepository();
const supplierRepository = new PrismaSupplierRepository();
const createStockEntryUseCase = new CreateStockEntryUseCase(stockEntryRepository, supplierRepository);

// ── Schema de validación Zod ──────────────────────────────────────────────────
const StockEntryItemSchema = z.object({
  variantId: z.number().int().positive('El ID de variante debe ser un entero positivo'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unitCost: z.number().positive('El costo unitario debe ser mayor a 0'),
});

const StockEntryDistributionItemSchema = z.object({
  branchId: z.number().int().positive('El ID de sucursal de destino debe ser un entero positivo'),
  variantId: z.number().int().positive('El ID de variante debe ser un entero positivo'),
  quantity: z.number().positive('La cantidad a distribuir debe ser mayor a 0'),
});

const CreateStockEntrySchema = z.object({
  supplierId: z.number().int().positive('El ID de proveedor debe ser un entero positivo'),
  invoiceNumber: z
    .string()
    .min(1, 'El número de comprobante no puede estar vacío')
    .max(50, 'El número de comprobante no puede exceder 50 caracteres'),
  branchId: z.number().int().positive('El ID de sucursal debe ser un entero positivo'),
  items: z
    .array(StockEntryItemSchema)
    .min(1, 'El ingreso debe contener al menos un ítem'),
  distributionItems: z
    .array(StockEntryDistributionItemSchema)
    .optional(),
});

// ── Utilidad DRY: parsear errores Zod ────────────────────────────────────────
const mapZodErrors = (issues: z.ZodIssue[]) =>
  issues.map((err) => ({ field: err.path.join('.'), message: err.message }));

export class StockEntryController {
  /**
   * POST /api/v1/stock/entries
   *
   * Registra un ingreso de mercadería desde un proveedor.
   * Ejecuta una transacción atómica que:
   *   1. Persiste StockEntry + StockEntryItems
   *   2. Actualiza (upsert) BranchStock por variante
   *   3. Genera asientos ENTRADA en el Kardex con saldos acumulados
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = CreateStockEntrySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, errors: mapZodErrors(validation.error.issues) });
      }

      const stockEntry = await createStockEntryUseCase.execute(validation.data);
      return res.status(201).json({ success: true, data: stockEntry });
    } catch (error: any) {
      if (error.message?.includes('DISTRIBUTION_EXCEEDS_ENTRY')) {
        return res.status(400).json({ success: false, error: error.message.replace('DISTRIBUTION_EXCEEDS_ENTRY: ', '') });
      }
      if (error.message?.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message?.includes('inactivo')) {
        return res.status(422).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}
