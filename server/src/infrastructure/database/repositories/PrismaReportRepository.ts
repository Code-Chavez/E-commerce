import { prisma } from "../prisma";
import { IReportRepository } from "../../../domain/repositories/IReportRepository";
import { LowRotationProduct } from "../../../domain/entities/LowRotationProduct";

export class PrismaReportRepository implements IReportRepository {
  async getLowRotationProducts(days: number): Promise<LowRotationProduct[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);

    // Get variants with their most recent SALIDA kardex entry, if any
    const variants = await prisma.productVariant.findMany({
      where: {
        // We only want variants where all their SALIDA entries are older than thresholdDate, 
        // or where they have no SALIDA entries at all.
        // It's easier to fetch all that don't have a SALIDA entry >= thresholdDate
        kardexEntries: {
          none: {
            type: "VENTA",
            createdAt: {
              gte: thresholdDate,
            },
          },
        },
      },
      include: {
        product: true,
        kardexEntries: {
          where: {
            type: "VENTA",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        branchStock: true,
      },
    });

    const now = new Date();

    return variants.map((v) => {
      let lastMovementDate = v.kardexEntries[0]?.createdAt || null;
      let referenceDate = lastMovementDate || v.createdAt;
      
      const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const currentStock = v.branchStock.reduce((acc, stock) => acc + (stock.quantity || 0), 0);

      return {
        variantId: String(v.id),
        sku: v.sku,
        productName: v.product.name,
        attributes: v.attributesJson as Record<string, any> || {},
        daysWithoutMovement: diffDays,
        lastMovementDate: lastMovementDate,
        currentStock,
      };
    });
  }
}
