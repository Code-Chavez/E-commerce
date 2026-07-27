import prisma from '@infrastructure/database/prisma';
import { IStockAlertRepository } from '@domain/repositories/IStockAlertRepository';
import { SystemSettingCacheService } from '@infrastructure/services/SystemSettingCacheService';

export class PrismaStockAlertRepository implements IStockAlertRepository {
  async getActiveAlertsWithQuantity(): Promise<
    Array<{
      sku: string;
      productName: string;
      branchName: string;
      currentStock: number;
      minStock: number;
    }>
  > {
    const globalMinStockStr = await SystemSettingCacheService.getSetting(
      'MIN_STOCK_ALERT',
      '10'
    );
    const globalMinStock = parseInt(globalMinStockStr, 10);

    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
        branchStock: {
          where: {
            status: 'AVAILABLE',
          },
        },
      },
    });

    const criticalStocks: Array<{
      sku: string;
      productName: string;
      branchName: string;
      currentStock: number;
      minStock: number;
    }> = [];

    for (const v of variants) {
      const globalStock = v.branchStock.reduce(
        (sum, stock) => sum + stock.quantity,
        0
      );

      const threshold =
        v.minStock && v.minStock > 0 ? v.minStock : globalMinStock;

      if (globalStock <= threshold) {
        criticalStocks.push({
          sku: v.sku,
          productName: v.product.name,
          branchName: 'Global',
          currentStock: globalStock,
          minStock: threshold,
        });
      }
    }

    return criticalStocks;
  }
}
