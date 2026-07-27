import prisma from '@infrastructure/database/prisma';
import { IEmailService } from '@domain/services/IEmailService';
import { restoreOrderStock } from './helpers/restoreOrderStock';
import { buildReturnConfirmationEmail } from '@infrastructure/email/templates/deliveryEmails';

export interface RequestReturnFromFailedInput {
  orderId: number;
  userId: number;
}

export interface RequestReturnFromFailedResult {
  orderId: number;
  deliveryId: number;
  orderStatus: string;
  refundStatus: string;
}

/**
 * El cliente decide la devolución tras un intento de entrega fallido.
 * Marca el pedido como RETURNED, reincorpora el stock al almacén principal
 * y deja el reembolso registrado como pendiente de procesar por el admin.
 */
export class RequestReturnFromFailedUseCase {
  constructor(private readonly emailService?: IEmailService) {}

  async execute(input: RequestReturnFromFailedInput): Promise<RequestReturnFromFailedResult> {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: {
        user: { select: { email: true, name: true } },
        items: true,
        deliveries: {
          where: { type: 'DELIVERY' },
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new Error(`Pedido #${input.orderId} no encontrado`);
    }

    if (order.userId !== input.userId) {
      throw new Error('No autorizado: el pedido no pertenece al usuario autenticado');
    }

    const lastDelivery = order.deliveries[0];
    if (!lastDelivery || lastDelivery.status !== 'AWAITING_CLIENT_DECISION') {
      throw new Error('El pedido no tiene un envío pendiente de decisión del cliente');
    }

    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: lastDelivery.id },
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
          changedBy: 'CLIENT_REQUESTED_RETURN',
        },
      });

      await restoreOrderStock(
        tx,
        order.items.map(i => ({ variantId: i.variantId, qty: i.qty })),
        input.userId,
      );
    });

    if (this.emailService && order.user?.email) {
      try {
        const email = buildReturnConfirmationEmail({
          userName: order.user.name || 'Cliente',
          orderId: order.id,
        });
        await this.emailService.sendEmail(order.user.email, email.subject, email.html);
      } catch (emailErr) {
        console.error(`Error enviando email de confirmación de devolución para orden #${order.id}:`, emailErr);
      }
    }

    return {
      orderId: order.id,
      deliveryId: lastDelivery.id,
      orderStatus: 'RETURNED',
      refundStatus: 'PENDING',
    };
  }
}
