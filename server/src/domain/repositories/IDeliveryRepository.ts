import { Delivery } from '@domain/entities/Delivery';

export interface IDeliveryRepository {
  findById(id: number): Promise<Delivery | null>;
  createDeliveryWithItems(
    orderId: number,
    items: Array<{ variantId: number; qty: number }>
  ): Promise<Delivery>;
  createPickupOrder(
    orderId: number,
    returnRequestId: number,
    items: Array<{ variantId: number; qty: number }>,
    tx?: any
  ): Promise<Delivery>;
  assignDeliveryMan(id: number, deliveryManId: number): Promise<Delivery>;
  findPaidOrdersWithoutDelivery(orderIds?: number[]): Promise<any[]>;
  findDeliveries(status?: string): Promise<Delivery[]>;
  updateStatus(id: number, status: string): Promise<Delivery>;
}
