import { IReturnRequestRepository } from '@domain/repositories/IReturnRequestRepository';
import { IDeliveryRepository } from '@domain/repositories/IDeliveryRepository';
import { ReturnRequest } from '@domain/entities/ReturnRequest';
import prisma from '@infrastructure/database/prisma';

export class ApproveReturnRequestUseCase {
  constructor(
    private readonly returnRequestRepository: IReturnRequestRepository,
    private readonly deliveryRepository: IDeliveryRepository
  ) {}

  async execute(id: number): Promise<ReturnRequest> {
    const returnRequestRecord = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            orderItem: true,
          },
        },
      },
    });

    if (!returnRequestRecord) {
      throw new Error(`Return request with ID ${id} not found`);
    }

    if (returnRequestRecord.status !== 'PENDING') {
      throw new Error(
        `Return request is already ${returnRequestRecord.status}`
      );
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Actualizar el estado de la solicitud de devolución
      const updatedReturnRequest = await tx.returnRequest.update({
        where: { id },
        data: { status: 'APPROVED' },
        include: {
          items: true,
        },
      });

      // 2. Mapear los items al formato del Delivery
      const pickupItems = returnRequestRecord.items.map((item) => ({
        variantId: item.orderItem.variantId,
        qty: item.qty,
      }));

      // 3. Crear el Delivery tipo PICKUP (orden de recojo)
      const pickupOrder = await this.deliveryRepository.createPickupOrder(
        returnRequestRecord.orderId,
        id,
        pickupItems,
        tx
      );

      return {
        id: updatedReturnRequest.id,
        orderId: updatedReturnRequest.orderId,
        userId: updatedReturnRequest.userId,
        reason: updatedReturnRequest.reason,
        status: updatedReturnRequest.status as any,
        refundType: updatedReturnRequest.refundType as any,
        pickupOrderId: pickupOrder.id,
        createdAt: updatedReturnRequest.createdAt,
        updatedAt: updatedReturnRequest.updatedAt,
        items: updatedReturnRequest.items.map((item) => ({
          id: item.id,
          returnRequestId: item.returnRequestId,
          orderItemId: item.orderItemId,
          qty: item.qty,
        })),
      };
    });
  }
}
