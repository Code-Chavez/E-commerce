import cron from 'node-cron';
import prisma from '@infrastructure/database/prisma';
import { SystemSettingCacheService } from '@infrastructure/services/SystemSettingCacheService';
import { restoreOrderStock } from '@application/use-cases/logistics/helpers/restoreOrderStock';

export class FailedDeliveryExpiryJob {
  public static start() {
    cron.schedule('0 * * * *', async () => {
      console.log('⏳ [Cron Job] Running Failed Delivery Expiry check...');
      try {
        const count = await FailedDeliveryExpiryJob.processExpired();
        if (count > 0) {
          console.log(`✅ [Cron Job] Auto-returned ${count} expired delivery(ies).`);
        } else {
          console.log('✅ [Cron Job] No expired deliveries found.');
        }
      } catch (error) {
        console.error('❌ [Cron Job] Error in Failed Delivery Expiry check:', error);
      }
    });
  }

  public static async processExpired(): Promise<number> {
    const hoursStr = await SystemSettingCacheService.getSetting(
      'FAILED_DELIVERY_DECISION_WINDOW_HOURS',
      '72',
    );
    const windowHours = parseInt(hoursStr, 10);
    const cutoffDate = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const expiredDeliveries = await prisma.delivery.findMany({
      where: {
        status: 'AWAITING_CLIENT_DECISION',
        updatedAt: { lt: cutoffDate },
      },
      include: {
        order: {
          include: {
            items: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
        pickingItems: true,
      },
    });

    let processed = 0;

    for (const delivery of expiredDeliveries) {
      const order = delivery.order;
      const notes = `Devolución automática — cliente no respondió en ${windowHours}h (Pedido #${order.id})`;
      const totalUnits = delivery.pickingItems.reduce((sum, i) => sum + i.qty, 0);

      const itemsToRestore = delivery.pickingItems.map((i) => ({
        variantId: i.variantId,
        qty: i.qty,
      }));

      try {
        await prisma.$transaction(async (tx) => {
          await tx.delivery.update({
            where: { id: delivery.id },
            data: { status: 'RETURNED' },
          });

          await tx.order.update({
            where: { id: order.id },
            data: { status: 'RETURNED', refundStatus: 'PENDING' },
          });

          await tx.orderStatusLog.create({
            data: {
              orderId: order.id,
              status: 'RETURNED',
              changedBy: 'SYSTEM_AUTO_RETURN',
            },
          });

          if (itemsToRestore.length > 0) {
            await restoreOrderStock(tx, itemsToRestore, null, notes);
          }

          await tx.failedDeliveryReturnAlert.upsert({
            where: { orderId: order.id },
            update: {
              productCount: totalUnits,
              windowHours,
              isActive: true,
              autoReturnedAt: new Date(),
            },
            create: {
              orderId: order.id,
              productCount: totalUnits,
              windowHours,
              isActive: true,
            },
          });
        });

        processed++;
        console.log(`[FailedDeliveryExpiryJob] Auto-returned order #${order.id} (${totalUnits} units restored).`);
      } catch (err) {
        console.error(`[FailedDeliveryExpiryJob] Failed to auto-return order #${order.id}:`, err);
      }
    }

    return processed;
  }
}
