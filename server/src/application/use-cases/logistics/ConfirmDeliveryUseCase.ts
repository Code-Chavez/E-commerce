import prisma from '@infrastructure/database/prisma';

export interface ConfirmDeliveryInput {
  deliveryId: number;
  deliveryPhotoUrl: string;
}

export interface ConfirmDeliveryResult {
  id: number;
  orderId: number;
  status: string;
  deliveryPhotoUrl: string;
  deliveredAt: Date;
}

export class ConfirmDeliveryUseCase {
  async execute(input: ConfirmDeliveryInput): Promise<ConfirmDeliveryResult> {
    const delivery = await prisma.delivery.findUnique({
      where: { id: input.deliveryId },
    });

    if (!delivery) {
      throw new Error(`Delivery #${input.deliveryId} no encontrado`);
    }

    const deliveredAt = new Date();

    const [updated] = await prisma.$transaction([
      prisma.delivery.update({
        where: { id: input.deliveryId },
        data: {
          status: 'DELIVERED',
          deliveryPhotoUrl: input.deliveryPhotoUrl,
          deliveredAt,
        },
        select: {
          id: true,
          orderId: true,
          status: true,
          deliveryPhotoUrl: true,
          deliveredAt: true,
        },
      }),
      prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' },
      }),
      prisma.orderStatusLog.create({
        data: {
          orderId: delivery.orderId,
          status: 'DELIVERED',
          changedBy: 'DELIVERY_PHOTO_CONFIRMED',
        },
      }),
    ]);

    return {
      id: updated.id,
      orderId: updated.orderId,
      status: updated.status,
      deliveryPhotoUrl: updated.deliveryPhotoUrl!,
      deliveredAt: updated.deliveredAt!,
    };
  }
}
