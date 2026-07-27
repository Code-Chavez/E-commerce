import prisma from '@infrastructure/database/prisma';
import { IBranchStockRepository, StockFilter, StockGroupedResult } from '@domain/repositories/IBranchStockRepository';

export class PrismaBranchStockRepository implements IBranchStockRepository {
  async getStockReport(filter: StockFilter): Promise<StockGroupedResult[]> {
    const whereClause: any = { isActive: true };

    if (filter.variantId) {
      whereClause.id = filter.variantId;
    }

    if (filter.sku) {
      whereClause.sku = { contains: filter.sku };
    }

    if (filter.branchId) {
      whereClause.branchStock = {
        some: { branchId: filter.branchId }
      };
    }

    const variants = await prisma.productVariant.findMany({
      where: whereClause,
      include: {
        product: true,
        branchStock: {
          include: { branch: true },
          where: filter.branchId ? { branchId: filter.branchId } : undefined,
        },
      },
      orderBy: { sku: 'asc' },
    });

    return variants.map((v: any) => {
      const byBranch = v.branchStock.map((bs: any) => ({
        branchId: bs.branchId,
        branchName: bs.branch.name,
        quantity: bs.quantity,
      }));

      const globalStock = byBranch.reduce((sum: number, item: any) => sum + item.quantity, 0);

      return {
        variantId: v.id,
        sku: v.sku,
        productName: v.product.name,
        globalStock,
        byBranch,
      };
    });
  }
}
