import { IReturnRequestRepository } from '@domain/repositories/IReturnRequestRepository';
import { IOrderRepository } from '@domain/repositories/IOrderRepository';
import { ReturnRequest } from '@domain/entities/ReturnRequest';

export class CreateReturnRequestUseCase {
  constructor(
    private readonly returnRequestRepository: IReturnRequestRepository,
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(data: {
    orderId: number;
    userId: number;
    reason: string;
    refundType: 'CREDIT_NOTE' | 'STORE_CREDIT';
    items: Array<{ orderItemId: number; qty: number }>;
  }): Promise<ReturnRequest> {
    const order = await this.orderRepository.findById(data.orderId);
    if (!order) {
      throw new Error(`Order with ID ${data.orderId} not found`);
    }

    if (order.userId !== data.userId) {
      throw new Error('You are not authorized to return items for this order');
    }

    if (order.status !== 'DELIVERED') {
      throw new Error('Only delivered orders can be returned');
    }

    // Validate that order has the selected items and within the correct quantities
    const orderItems = order.items || [];
    for (const item of data.items) {
      const matchedItem = orderItems.find((oi) => oi.id === item.orderItemId);
      if (!matchedItem) {
        throw new Error(`Item ${item.orderItemId} does not belong to this order`);
      }
      if (item.qty <= 0) {
        throw new Error(`Invalid return quantity for item ${item.orderItemId}`);
      }
      if (item.qty > matchedItem.qty) {
        throw new Error(`Return quantity exceeds ordered quantity for item ${item.orderItemId}`);
      }
    }

    return await this.returnRequestRepository.create(data);
  }
}
