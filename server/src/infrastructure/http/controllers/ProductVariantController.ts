import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaProductVariantRepository } from '@infrastructure/database/repositories/PrismaProductVariantRepository';
import { PrismaProductRepository } from '@infrastructure/database/repositories/PrismaProductRepository';
import { CreateVariantsUseCase } from '@application/use-cases/product/CreateVariantsUseCase';
import { UpdateVariantUseCase } from '@application/use-cases/product/UpdateVariantUseCase';
import { SearchVariantsUseCase } from '@application/use-cases/product/SearchVariantsUseCase';
import { PrismaAuditLogRepository } from '@infrastructure/database/repositories/PrismaAuditLogRepository';
import { PrismaAuditService } from '@infrastructure/services/PrismaAuditService';

// Instancias de repositorios y use cases
const productRepository = new PrismaProductRepository();
const variantRepository = new PrismaProductVariantRepository();
const auditLogRepository = new PrismaAuditLogRepository();
const auditService = new PrismaAuditService(auditLogRepository);

const createVariantsUseCase = new CreateVariantsUseCase(
  productRepository,
  variantRepository
);
const updateVariantUseCase = new UpdateVariantUseCase(
  variantRepository,
  auditService
);
const searchVariantsUseCase = new SearchVariantsUseCase(variantRepository);

// ─────────────────────────────────────────────────────────────────────────────
// Zod Schemas de Validación — T-077 / T-078
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schema para crear variantes:
 * attributes: mapa de nombre_atributo → lista de valores posibles
 * Ej: { "talla": ["S", "M", "L"], "color": ["NEGRO", "BLANCO"] }
 */
const CreateVariantsSchema = z.object({
  attributes: z
    .record(
      z.string().min(1, 'El nombre del atributo no puede estar vacío'),
      z
        .array(z.string().min(1, 'El valor del atributo no puede estar vacío'))
        .min(1, 'Cada atributo debe tener al menos un valor')
    )
    .refine((attrs) => Object.keys(attrs).length > 0, {
      message: 'Debes proporcionar al menos un atributo',
    }),
  basePrice: z
    .number({ message: 'El precio base debe ser un número' })
    .positive('El precio debe ser mayor a 0')
    .max(999999.99, 'El precio no puede exceder 999,999.99'),
  baseCostPrice: z
    .number({ message: 'El precio de costo debe ser un número' })
    .min(0, 'El precio de costo no puede ser negativo')
    .max(999999.99, 'El precio de costo no puede exceder 999,999.99')
    .optional(),
});

/**
 * Schema para editar una variante individual:
 * Permite editar sku y/o precio. Al menos un campo requerido.
 */
const UpdateVariantSchema = z
  .object({
    sku: z
      .string()
      .min(2, 'El SKU debe tener al menos 2 caracteres')
      .max(100, 'El SKU no puede exceder 100 caracteres')
      .regex(
        /^[A-Z0-9_\-]+$/i,
        'El SKU solo puede contener letras, números, guiones y guiones bajos'
      )
      .optional(),
    price: z
      .number()
      .positive('El precio debe ser mayor a 0')
      .max(999999.99, 'El precio no puede exceder 999,999.99')
      .optional(),
    costPrice: z
      .number()
      .min(0, 'El precio de costo no puede ser negativo')
      .max(999999.99, 'El precio de costo no puede exceder 999,999.99')
      .optional(),
    isActive: z.boolean().optional(),
    discountPercent: z
      .number()
      .min(0, 'El descuento no puede ser menor a 0')
      .max(99, 'El descuento no puede ser mayor a 99')
      .optional(),
  })
  .refine(
    (data) =>
      data.sku !== undefined ||
      data.price !== undefined ||
      data.costPrice !== undefined ||
      data.isActive !== undefined ||
      data.discountPercent !== undefined,
    {
      message:
        'Debes proporcionar al menos un campo a actualizar (sku, price, costPrice, discountPercent o isActive)',
    }
  );

const UpdateVariantMinStockSchema = z.object({
  minStock: z
    .number()
    .int('El stock mínimo debe ser un número entero')
    .min(0, 'El stock mínimo no puede ser negativo'),
});

// ─────────────────────────────────────────────────────────────────────────────
// ProductVariantController — HU-014
// ─────────────────────────────────────────────────────────────────────────────
export class ProductVariantController {
  /**
   * GET /api/v1/products/:id/variants
   * Obtiene todas las variantes de un producto
   */
  async getVariantsByProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = parseInt(String(req.params.id), 10);
      if (isNaN(productId)) {
        return res
          .status(400)
          .json({ success: false, error: 'ID de producto inválido' });
      }

      const product = await productRepository.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: 'El producto no existe' });
      }

      const variants = await variantRepository.findByProductId(productId);
      return res.status(200).json({ success: true, data: variants });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/products/:id/variants
   * Genera combinaciones de atributos y crea variantes con SKU auto-generado
   *
   * Body: { attributes: { talla: ["S","M"], color: ["NEGRO","BLANCO"] }, basePrice: 99.90 }
   * Resultado: 4 variantes con SKUs únicos (CODIGO-S-NEGRO, CODIGO-S-BLANCO, ...)
   */
  async createVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = parseInt(String(req.params.id), 10);
      if (isNaN(productId)) {
        return res
          .status(400)
          .json({ success: false, error: 'ID de producto inválido' });
      }

      const validation = CreateVariantsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const result = await createVariantsUseCase.execute(
        productId,
        validation.data
      );
      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (
        error.message.includes('ya existen') ||
        error.message.includes('ya está asignado')
      ) {
        return res.status(409).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * PUT /api/v1/variants/:id
   * Edita precio y/o SKU de una variante individual.
   * Valida unicidad de SKU antes de persistir.
   */
  async updateVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, error: 'ID de variante inválido' });
      }

      const validation = UpdateVariantSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const variant = await updateVariantUseCase.execute(
        id,
        validation.data,
        (req as any).auth?.userId
      );
      return res.status(200).json({ success: true, data: variant });
    } catch (error: any) {
      if (error.message.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message.includes('ya está asignado')) {
        return res.status(409).json({ success: false, error: error.message });
      }
      if (
        error.message.includes('mayor a 0') ||
        error.message.includes('mayor al precio de venta') ||
        error.message.includes('no puede ser negativo')
      ) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/v1/variants/:id/min-stock
   * Actualiza únicamente el umbral de stock mínimo de una variante.
   */
  async updateMinStock(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, error: 'ID de variante inválido' });
      }

      const validation = UpdateVariantMinStockSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const variant = await updateVariantUseCase.execute(id, {
        minStock: validation.data.minStock,
      });
      return res.status(200).json({ success: true, data: variant });
    } catch (error: any) {
      if (error.message.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/variants/search
   * Permite buscar variantes de productos por texto libre (coincidencia parcial en SKU o nombre de producto)
   */
  async searchVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query.q;
      if (typeof q !== 'string' || q.trim() === '') {
        return res.status(400).json({
          success: false,
          error:
            'El parámetro de búsqueda "q" es requerido y no puede estar vacío',
        });
      }

      let limit = 10;
      if (req.query.limit) {
        const parsedLimit = parseInt(String(req.query.limit), 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = Math.min(parsedLimit, 50); // Límite máximo de 50 para evitar sobrecarga
        }
      }

      const results = await searchVariantsUseCase.execute(q, limit);
      return res.status(200).json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }
}
