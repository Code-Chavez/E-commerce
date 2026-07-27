import cron from 'node-cron';
import prisma from '@infrastructure/database/prisma';
import { SystemSettingCacheService } from '@infrastructure/services/SystemSettingCacheService';

export class StockAlertJob {
  public static start() {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
      console.log('⏳ [Cron Job] Running Stock Alert check...');
      try {
        await StockAlertJob.processAlerts();
        console.log('✅ [Cron Job] Stock Alert check finished.');
      } catch (error) {
        console.error('❌ [Cron Job] Error checking stock alerts:', error);
      }
    });
  }

  public static async processAlerts() {
    // Buscar el stock en todas las sucursales que sea menor al stock mínimo de la variante (y que esté activo)
    const criticalStocks = await prisma.branchStock.findMany({
      where: {
        status: 'AVAILABLE',
        variant: {
          isActive: true
        }
      },
      include: {
        variant: true
      }
    });

    const globalMinStockStr = await SystemSettingCacheService.getSetting('MIN_STOCK_ALERT', '5');
    const globalMinStock = parseInt(globalMinStockStr, 10);

    for (const stock of criticalStocks) {
      // Nota (HU-027): MIN_STOCK_ALERT actúa como fallback global. 
      // Si la variante tiene minStock > 0, se usa ese; sino, el setting global.
      // Queda como mejora futura la granularidad estricta por sucursal.
      const threshold = (stock.variant.minStock && stock.variant.minStock > 0)
        ? stock.variant.minStock
        : globalMinStock;

      if (stock.quantity < threshold) {
        // Upsert alerta de stock
        await prisma.stockAlert.upsert({
          where: {
            variantId_branchId: {
              variantId: stock.variantId,
              branchId: stock.branchId
            }
          },
          update: {
            isActive: true
          },
          create: {
            variantId: stock.variantId,
            branchId: stock.branchId,
            isActive: true
          }
        });
      } else {
        // Si la cantidad ya superó el stock mínimo, desactivamos la alerta si existe
        await prisma.stockAlert.updateMany({
          where: {
            variantId: stock.variantId,
            branchId: stock.branchId,
            isActive: true
          },
          data: {
            isActive: false
          }
        });
      }
    }
  }
}
