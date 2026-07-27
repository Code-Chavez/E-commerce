import { IOrderRepository } from '@domain/repositories/IOrderRepository';
import {
  ListOrdersInputDTO,
  ListOrdersResponseDTO,
} from '@application/dtos/OrderDTOs';

export class ListUserOrdersUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(input: ListOrdersInputDTO): Promise<ListOrdersResponseDTO> {
    const { userId, status, page, limit } = input;

    const skip = (page - 1) * limit;
    const take = limit;

    const { orders, totalCount } = await this.orderRepository.findByUserId(
      userId,
      {
        status,
        skip,
        take,
      }
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      orders: orders.map((order) => ({
        id: order.id,
        status: order.status,
        total: order.total,
        shippingCost: order.shippingCost,
        addressSnapshot: order.addressSnapshot,
        paymentIntentId: order.paymentIntentId,
        // El PIN solo se expone mientras el pedido está en tránsito hacia el cliente
        deliveryPin: ['PAID', 'SHIPPED'].includes(order.status)
          ? (order.deliveryPin ?? null)
          : null,
        refundStatus: order.refundStatus,
        isRedelivery: order.isRedelivery,
        currentDeliveryStatus: order.currentDeliveryStatus,
        failedAttempts: order.failedAttempts,
        createdAt: order.createdAt,
        items: order.items?.map((item) => ({
          id: item.id,
          variantId: item.variantId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          variantSku: item.variantSku,
          productName: item.productName,
        })),
        statusLogs: order.statusLogs?.map((log) => ({
          id: log.id,
          status: log.status,
          changedAt: log.changedAt,
          changedBy: log.changedBy,
        })),
        returnRequests: order.returnRequests?.map((req) => ({
          id: req.id,
          status: req.status,
          reason: req.reason,
          pickupOrder: req.pickupOrder || null,
        })),
      })),
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }
}
