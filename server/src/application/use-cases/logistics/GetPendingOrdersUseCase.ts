import { IDeliveryRepository } from '@domain/repositories/IDeliveryRepository';

export class GetPendingOrdersUseCase {
  constructor(private readonly deliveryRepository: IDeliveryRepository) {}

  async execute(): Promise<any[]> {
    const orders = await this.deliveryRepository.findPaidOrdersWithoutDelivery();
    return orders.map((order) => ({
      id: order.id,
      orderId: order.id,
      customerName: [order.user?.name, order.user?.lastName].filter(Boolean).join(' ') || 'Cliente',
      itemsCount: order.items?.reduce((acc: number, item: any) => acc + item.qty, 0) || 0,
      totalAmount: Number(order.total),
      status: order.status,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
    }));
  }
}
