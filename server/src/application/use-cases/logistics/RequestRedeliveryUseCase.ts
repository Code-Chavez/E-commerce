import prisma from '@infrastructure/database/prisma';
import { IEmailService } from '@domain/services/IEmailService';
import { buildRedeliveryConfirmationEmail } from '@infrastructure/email/templates/deliveryEmails';

export interface RequestRedeliveryInput {
  orderId: number;
  userId: number;
}

export interface RequestRedeliveryResult {
  newDeliveryId: number;
  parentDeliveryId: number;
  orderId: number;
  orderStatus: string;
}

/**
 * El cliente solicita un reenvío tras un intento de entrega fallido.
 * Crea un nuevo Delivery enlazado al anterior mediante parentDeliveryId
 * (trazabilidad de la cadena de reenvíos) y devuelve el pedido al flujo normal.
 */
export class RequestRedeliveryUseCase {
  constructor(private readonly emailService?: IEmailService) {}

  async execute(
    input: RequestRedeliveryInput
  ): Promise<RequestRedeliveryResult> {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: {
        user: { select: { email: true, name: true } },
        deliveries: {
          where: { type: 'DELIVERY' },
          orderBy: { id: 'desc' },
          take: 1,
          include: { pickingItems: true },
        },
      },
    });

    if (!order) {
      throw new Error(`Pedido #${input.orderId} no encontrado`);
    }

    if (order.userId !== input.userId) {
      throw new Error(
        'No autorizado: el pedido no pertenece al usuario autenticado'
      );
    }

    const lastDelivery = order.deliveries[0];
    if (!lastDelivery || lastDelivery.status !== 'AWAITING_CLIENT_DECISION') {
      throw new Error(
        'El pedido no tiene un envío pendiente de decisión del cliente'
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cerrar definitivamente el delivery fallido (trazabilidad)
      await tx.delivery.update({
        where: { id: lastDelivery.id },
        data: { status: 'FAILED' },
      });

      // 2. Crear el nuevo delivery enlazado al anterior
      const newDelivery = await tx.delivery.create({
        data: {
          orderId: order.id,
          type: 'DELIVERY',
          status: 'PENDING',
          parentDeliveryId: lastDelivery.id,
          pickingItems: {
            create: lastDelivery.pickingItems.map((item) => ({
              variantId: item.variantId,
              qty: item.qty,
            })),
          },
        },
      });

      // 3. El pedido vuelve al flujo normal de envío
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'SHIPPED' },
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: 'SHIPPED',
          changedBy: 'CLIENT_REQUESTED_REDELIVERY',
        },
      });

      return newDelivery;
    });

    if (this.emailService && order.user?.email) {
      try {
        const email = buildRedeliveryConfirmationEmail({
          userName: order.user.name || 'Cliente',
          orderId: order.id,
        });
        await this.emailService.sendEmail(
          order.user.email,
          email.subject,
          email.html
        );
      } catch (emailErr) {
        console.error(
          `Error enviando email de confirmación de reenvío para orden #${order.id}:`,
          emailErr
        );
      }
    }

    return {
      newDeliveryId: result.id,
      parentDeliveryId: lastDelivery.id,
      orderId: order.id,
      orderStatus: 'SHIPPED',
    };
  }
}
