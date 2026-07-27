import prisma from '@infrastructure/database/prisma';
import { DeliveryStateMachine } from '@domain/services/DeliveryStateMachine';
import { requestContext } from '@infrastructure/context/RequestContext';
import { restoreOrderStock } from './helpers/restoreOrderStock';

export class ReturnDeliveryUseCase {
  async execute(deliveryId: number): Promise<any> {
    // Buscar el delivery y su orden relacionada
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            items: true
          }
        }
      }
    });

    if (!delivery) {
      throw new Error(`Delivery with ID ${deliveryId} not found`);
    }

    // Validar la transición de estado
    DeliveryStateMachine.validateTransition(delivery.status, 'RETURNED');

    // Realizar la reincorporación dentro de una transacción atómica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar estado del Delivery
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: { status: 'RETURNED' }
      });

      // 2. Actualizar estado de la Orden y marcar reembolso pendiente
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: 'RETURNED', refundStatus: 'PENDING' }
      });

      // Registrar OrderStatusLog
      await tx.orderStatusLog.create({
        data: {
          orderId: delivery.orderId,
          status: 'RETURNED',
          changedBy: 'SYSTEM (Delivery Returned)'
        }
      });

      // 3. Reincorporar stock e insertar Kardex (DEVOLUCION)
      await restoreOrderStock(
        tx,
        delivery.order.items.map(i => ({ variantId: i.variantId, qty: i.qty })),
        requestContext.getStore()?.userId ?? null,
      );

      return updatedDelivery;
    });

    return result;
  }
}
