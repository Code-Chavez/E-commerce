import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '@infrastructure/database/prisma';
import { normalizeAttributesJson } from '@infrastructure/database/utils/AttributeNormalizer';

const BestSellersQuerySchema = z.object({
  limit: z.preprocess((val) => (val ? Number(val) : undefined), z.number().int().positive().default(10)),
});

export class ProductBestSellersController {
  async getBestSellers(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = BestSellersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          errors: parsed.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const { limit } = parsed.data;

      // Calcular fecha de hace 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 1. Consultar Kardex para obtener las variantes más vendidas
      const topVariants = await prisma.kardexEntry.groupBy({
        by: ['variantId'],
        where: {
          type: 'VENTA',
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: limit,
      });

      if (topVariants.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      const variantIds = topVariants.map((tv) => tv.variantId);

      // 2. Traer los datos de las variantes y sus productos
      const variantsData = await prisma.productVariant.findMany({
        where: {
          id: { in: variantIds },
          isActive: true,
          product: { isActive: true },
        },
        include: {
          product: {
            include: {
              images: true,
              category: true,
              brand: true,
            },
          },
          branchStock: true,
        },
      });

      // 3. Formatear y ordenar según el resultado del Kardex
      const resultData = topVariants
        .map((tv) => {
          const variant = variantsData.find((v) => v.id === tv.variantId);
          if (!variant) return null;

          const stockQuantity = variant.branchStock.reduce((sum, bs) => sum + bs.quantity, 0);

          return {
            id: variant.id,
            productId: variant.productId,
            sku: variant.sku,
            price: Number(variant.price),
            discountPercent: variant.discountPercent,
            attributesJson: normalizeAttributesJson(variant.attributesJson),
            isActive: variant.isActive,
            minStock: variant.minStock,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt,
            stock: stockQuantity,
            outOfStock: stockQuantity <= 0,
            product: variant.product,
            salesInLast30Days: tv._sum.quantity,
          };
        })
        .filter(Boolean); // Remover nulos si una variante se inactivó

      return res.status(200).json({
        success: true,
        data: resultData,
      });
    } catch (error) {
      next(error);
    }
  }
}
