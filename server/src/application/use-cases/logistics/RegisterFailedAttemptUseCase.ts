import prisma from '@infrastructure/database/prisma';
import { IEmailService } from '@domain/services/IEmailService';
import { requestContext } from '@infrastructure/context/RequestContext';
import { restoreOrderStock } from './helpers/restoreOrderStock';
import {
  buildFailedDeliveryDecisionEmail,
  buildForcedReturnEmail,
} from '@infrastructure/email/templates/deliveryEmails';

export interface RegisterFailedAttemptInput {
  deliveryId: number;
  reason: string;
  rescheduledFor?: Date;
}

export interface FailedAttemptResult {
  id: number;
  deliveryId: number;
  reason: string;
  attemptedAt: Date;
  rescheduledFor: Date | null;
  attemptNumber: number;
  deliveryStatus: string;
  forcedReturn: boolean;
}

/**
 * Máximo de intentos fallidos permitidos para un mismo pedido (contando toda
 * la cadena de reenvíos). Al superarse, el pedido se devuelve automáticamente.
 */
const MAX_FAILED_ATTEMPTS = 2;

export class RegisterFailedAttemptUseCase {
  constructor(private readonly emailService?: IEmailService) {}

  async execute(input: RegisterFailedAttemptInput): Promise<FailedAttemptResult> {
    const delivery = await prisma.delivery.findUnique({
      where: { id: input.deliveryId },
      include: {
        order: {
          include: {
            user: { select: { email: true, name: true } },
            items: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new Error(`Delivery #${input.deliveryId} no encontrado`);
    }

    // Contar intentos fallidos previos de TODO el pedido (toda la cadena de reenvíos)
    const previousAttempts = await prisma.failedDeliveryAttempt.count({
      where: { delivery: { orderId: delivery.orderId } },
    });
    const attemptNumber = previousAttempts + 1;
    const forcedReturn = attemptNumber > MAX_FAILED_ATTEMPTS;

    const attempt = await prisma.$transaction(async (tx) => {
      const created = await tx.failedDeliveryAttempt.create({
        data: {
          deliveryId: input.deliveryId,
          reason: input.reason,
          rescheduledFor: input.rescheduledFor ?? null,
        },
      });

      if (forcedReturn) {
        // Se agotaron los intentos: devolución automática con reincorporación de stock
        await tx.delivery.update({
          where: { id: input.deliveryId },
          data: { status: 'RETURNED' },
        });
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: 'RETURNED', refundStatus: 'PENDING' },
        });
        await tx.orderStatusLog.create({
          data: {
            orderId: delivery.orderId,
            status: 'RETURNED',
            changedBy: 'SYSTEM (Max Failed Attempts)',
          },
        });
        await restoreOrderStock(
          tx,
          delivery.order.items.map(i => ({ variantId: i.variantId, qty: i.qty })),
          requestContext.getStore()?.userId ?? null,
        );
      } else {
        // Aún hay intentos disponibles: el cliente decide reenvío o devolución
        await tx.delivery.update({
          where: { id: input.deliveryId },
          data: { status: 'AWAITING_CLIENT_DECISION' },
        });
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: 'FAILED' },
        });
        await tx.orderStatusLog.create({
          data: {
            orderId: delivery.orderId,
            status: 'FAILED',
            changedBy: `DELIVERY_ATTEMPT_${attemptNumber}_FAILED`,
          },
        });
      }

      return created;
    });

    // Notificación al cliente (fuera de la transacción: un fallo de email no revierte el registro)
    if (this.emailService && delivery.order.user?.email) {
      const userName = delivery.order.user.name || 'Cliente';
      try {
        const email = forcedReturn
          ? buildForcedReturnEmail({ userName, orderId: delivery.orderId, attemptNumber })
          : buildFailedDeliveryDecisionEmail({
              userName,
              orderId: delivery.orderId,
              reason: input.reason,
              attemptNumber,
              rescheduledFor: input.rescheduledFor ?? null,
            });
        await this.emailService.sendEmail(delivery.order.user.email, email.subject, email.html);
      } catch (emailErr) {
        console.error(`Error enviando email de intento fallido para orden #${delivery.orderId}:`, emailErr);
      }
    }

    return {
      id: attempt.id,
      deliveryId: attempt.deliveryId,
      reason: attempt.reason,
      attemptedAt: attempt.attemptedAt,
      rescheduledFor: attempt.rescheduledFor,
      attemptNumber,
      deliveryStatus: forcedReturn ? 'RETURNED' : 'AWAITING_CLIENT_DECISION',
      forcedReturn,
    };
  }
}
