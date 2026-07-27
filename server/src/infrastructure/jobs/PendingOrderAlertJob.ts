import cron from 'node-cron';
import prisma from '@infrastructure/database/prisma';
import { SystemSettingCacheService } from '@infrastructure/services/SystemSettingCacheService';

export class PendingOrderAlertJob {
  public static start() {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      console.log('⏳ [Cron Job] Running Pending Order Alert check...');
      try {
        await PendingOrderAlertJob.processAlerts();
        console.log('✅ [Cron Job] Pending Order Alert check finished.');
      } catch (error) {
        console.error('❌ [Cron Job] Error checking pending order alerts:', error);
      }
    });
  }

  public static async processAlerts() {
    const hoursStr = await SystemSettingCacheService.getSetting('PENDING_ORDER_TOLERANCE_HOURS', '2');
    const hours = parseInt(hoursStr, 10);
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hours);

    // Find orders that are PAID, have no delivery, and were created before the threshold
    const orders = await prisma.order.findMany({
      where: {
        status: 'PAID',
        deliveries: {
          none: {
            type: 'DELIVERY'
          }
        },
        createdAt: {
          lt: thresholdDate
        }
      },
      select: {
        id: true
      }
    });

    for (const order of orders) {
      // Upsert the alert
      await prisma.pendingOrderAlert.upsert({
        where: {
          orderId: order.id
        },
        update: {
          isActive: true
        },
        create: {
          orderId: order.id,
          isActive: true
        }
      });
    }

    // Optional: resolve alerts if an order is no longer in the list
    // An alert should be inactive if the order now has a delivery or is no longer PAID
    const activeAlerts = await prisma.pendingOrderAlert.findMany({
      where: {
        isActive: true
      },
      include: {
        order: {
          include: {
            deliveries: true
          }
        }
      }
    });

    for (const alert of activeAlerts) {
      if (alert.order.status !== 'PAID' || alert.order.deliveries.some(d => d.type === 'DELIVERY')) {
        await prisma.pendingOrderAlert.update({
          where: {
            id: alert.id
          },
          data: {
            isActive: false
          }
        });
      }
    }
  }
}
