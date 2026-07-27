import { DeliveryZone } from '../../../domain/entities/DeliveryZone';
import { IDeliveryZoneRepository } from '../../../domain/repositories/IDeliveryZoneRepository';

export class GetDeliveryZoneByDistrictUseCase {
  constructor(private readonly deliveryZoneRepository: IDeliveryZoneRepository) {}

  async execute(district: string): Promise<DeliveryZone | null> {
    if (!district || district.trim() === '') return null;
    return await this.deliveryZoneRepository.findByDistrict(district.trim());
  }
}
