import { IDeliveryRepository } from '@domain/repositories/IDeliveryRepository';
import { IOrderRepository } from '@domain/repositories/IOrderRepository';
import { IShippingLabelService } from '@domain/services/IShippingLabelService';

export class GenerateShippingLabelUseCase {
  constructor(
    private readonly deliveryRepository: IDeliveryRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly shippingLabelService: IShippingLabelService
  ) {}

  async execute(deliveryId: number): Promise<NodeJS.ReadableStream> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const order = await this.orderRepository.findById(delivery.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Extract recipient information
    const recipientName = order.user?.name || 'Customer';

    const addressSnap = order.addressSnapshot || {};
    const fullAddress = addressSnap.fullAddress || 'No Address Provided';
    const district = addressSnap.district || 'No District';

    // Format unique tracking code
    const trackingCode = `TRK-DEL-${String(delivery.id).padStart(6, '0')}`;

    return await this.shippingLabelService.generateLabelPdfStream({
      recipientName,
      fullAddress,
      district,
      trackingCode,
    });
  }
}
