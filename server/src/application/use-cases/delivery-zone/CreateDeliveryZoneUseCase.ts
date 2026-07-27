import { DeliveryZone } from '../../../domain/entities/DeliveryZone';
import { IDeliveryZoneRepository } from '../../../domain/repositories/IDeliveryZoneRepository';

export interface CreateDeliveryZoneDTO {
  districts: string[];
  deliveryCost: number;
  estimatedDays: number;
}

export class CreateDeliveryZoneUseCase {
  constructor(private readonly deliveryZoneRepository: IDeliveryZoneRepository) {}

  async execute(dto: CreateDeliveryZoneDTO): Promise<DeliveryZone> {
    // Check if any district already belongs to another zone
    for (const district of dto.districts) {
      const existing = await this.deliveryZoneRepository.findByDistrict(district);
      if (existing) {
        throw new Error(`El distrito ${district} ya pertenece a otra zona de envío (ID: ${existing.id})`);
      }
    }

    return await this.deliveryZoneRepository.create(dto);
  }
}
