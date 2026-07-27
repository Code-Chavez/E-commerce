import { Delivery } from '@domain/entities/Delivery';
import { IDeliveryRepository } from '@domain/repositories/IDeliveryRepository';

export class GetDeliveriesUseCase {
  constructor(private readonly deliveryRepository: IDeliveryRepository) {}

  async execute(status?: string): Promise<Delivery[]> {
    return await this.deliveryRepository.findDeliveries(status);
  }
}
