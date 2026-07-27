import { Delivery } from '@domain/entities/Delivery';
import { IDeliveryRepository } from '@domain/repositories/IDeliveryRepository';

export class GeneratePickingListUseCase {
  constructor(private readonly deliveryRepository: IDeliveryRepository) {}

  async execute(orderIds?: number[]): Promise<Delivery[]> {
    const orders = await this.deliveryRepository.findPaidOrdersWithoutDelivery(orderIds);
    const deliveries: Delivery[] = [];

    for (const order of orders) {
      // Map order items to variantId and qty
      const items = order.items.map((item: any) => ({
        variantId: item.variantId,
        qty: item.qty,
      }));

      const delivery = await this.deliveryRepository.createDeliveryWithItems(order.id, items);
      deliveries.push(delivery);
    }

    return deliveries;
  }
}
