import prisma from '@infrastructure/database/prisma';
import { IDemandForecastRepository, VariantHistoricalData } from '@domain/repositories/IDemandForecastRepository';
import { normalizeAttributesJson } from '@infrastructure/database/utils/AttributeNormalizer';

export class PrismaDemandForecastRepository implements IDemandForecastRepository {
  async getVariantSalesAndStock(startDate: Date): Promise<VariantHistoricalData[]> {
    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true
      },
      include: {
        product: {
          include: {
            category: true
          }
        },
        kardexEntries: {
          where: {
            type: 'VENTA',
            createdAt: {
              gte: startDate
            }
          },
          select: {
            quantity: true
          }
        },
        branchStock: {
          where: {
            status: 'AVAILABLE'
          },
          select: {
            quantity: true
          }
        }
      }
    });

    return variants.map(v => {
      const attributes = normalizeAttributesJson(v.attributesJson);
      const size = attributes.talla || attributes.Talla || attributes.size || attributes.Size || 'N/A';
      const categoryName = v.product.category?.name || 'Uncategorized';

      const totalSalesQty = v.kardexEntries.reduce((sum, entry) => sum + entry.quantity, 0);
      const currentStock = v.branchStock.reduce((sum, stock) => sum + stock.quantity, 0);

      return {
        variantId: v.id,
        categoryName,
        size,
        totalSalesQty,
        currentStock
      };
    });
  }
}
