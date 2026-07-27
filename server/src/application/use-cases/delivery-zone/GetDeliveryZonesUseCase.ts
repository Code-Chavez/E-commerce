import { DeliveryZone } from '../../../domain/entities/DeliveryZone';
import { IDeliveryZoneRepository } from '../../../domain/repositories/IDeliveryZoneRepository';

export class GetDeliveryZonesUseCase {
  constructor(private readonly deliveryZoneRepository: IDeliveryZoneRepository) {}

  async execute(): Promise<DeliveryZone[]> {
    return await this.deliveryZoneRepository.findAll();
  }
}
