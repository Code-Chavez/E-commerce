import prisma from '@infrastructure/database/prisma';
import { IPosProductRepository, PosProductResult } from '@domain/repositories/IPosProductRepository';

export class PrismaPosProductRepository implements IPosProductRepository {
  async searchProducts(query: string, branchId: number): Promise<PosProductResult[]> {
    // 1. Buscar todas las variantes activas de productos activos que coincidan por SKU o por nombre de producto
    const records = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: {
          isActive: true,
        },
        OR: [
          {
            sku: {
              contains: query,
            },
          },
          {
            product: {
              name: {
                contains: query,
              },
            },
          },
        ],
      },
      include: {
        product: true,
        branchStock: {
          where: {
            branchId: branchId,
          },
        },
      },
    });

    // 2. Mapear al resultado esperado
    return records.map((record) => {
      const branchStockRecord = record.branchStock[0];
      const stock = branchStockRecord ? branchStockRecord.quantity : 0;

      // Normalizar attributes a un Record<string, string> plano
      const attributes = record.attributesJson as any;
      const flatAttributes: Record<string, string> = {};
      
      if (attributes && typeof attributes === 'object') {
        Object.entries(attributes).forEach(([key, val]) => {
          if (val && typeof val === 'object' && 'value' in (val as any)) {
            // Formato enriquecido: { "1": { name: "Color", value: "Negro" } }
            const name = (val as any).name || key;
            flatAttributes[name] = String((val as any).value);
          } else {
            // Formato simple: { "color": "Blanco", "talla": "40" }
            flatAttributes[key] = String(val);
          }
        });
      }

      let fullName = record.product.name;
      if (Object.keys(flatAttributes).length > 0) {
        const parts = Object.values(flatAttributes).join(' - ');
        if (parts) {
          fullName += ` - ${parts}`;
        }
      }

      return {
        variantId: record.id,
        productId: record.productId,
        sku: record.sku,
        name: fullName,
        baseName: record.product.name,
        price: Number(record.price),
        stock: stock,
        attributes: flatAttributes,
      };
    });
  }
}
