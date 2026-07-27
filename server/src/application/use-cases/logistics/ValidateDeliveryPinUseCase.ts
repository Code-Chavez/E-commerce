import prisma from '@infrastructure/database/prisma';

export interface ValidateDeliveryPinInput {
  deliveryId: number;
  pin: string;
}

export interface ValidateDeliveryPinResult {
  deliveryId: number;
  orderId: number;
  status: string;
  deliveredAt: Date;
}

export class ValidateDeliveryPinUseCase {
  async execute(input: ValidateDeliveryPinInput): Promise<ValidateDeliveryPinResult> {
    const delivery = await prisma.delivery.findUnique({
      where: { id: input.deliveryId },
      include: {
        order: { select: { id: true, deliveryPin: true } },
      },
    });

    if (!delivery) {
      throw new Error(`Delivery #${input.deliveryId} no encontrado`);
    }

    if (!delivery.order.deliveryPin) {
      throw new Error('Este pedido no tiene un PIN de seguridad asignado');
    }

    if (delivery.order.deliveryPin !== input.pin.trim()) {
      throw new Error('PIN incorrecto. Verifica el código enviado al cliente.');
    }

    const deliveredAt = new Date();

    const [updatedDelivery] = await prisma.$transaction([
      prisma.delivery.update({
        where: { id: input.deliveryId },
        data: { status: 'DELIVERED', deliveredAt },
      }),
      prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' },
      }),
      prisma.orderStatusLog.create({
        data: {
          orderId: delivery.orderId,
          status: 'DELIVERED',
          changedBy: 'DELIVERY_PIN',
        },
      }),
    ]);

    return {
      deliveryId: updatedDelivery.id,
      orderId: delivery.orderId,
      status: updatedDelivery.status,
      deliveredAt,
    };
  }
}
