import { DeliveryZone } from '../../../domain/entities/DeliveryZone';
import { IDeliveryZoneRepository } from '../../../domain/repositories/IDeliveryZoneRepository';

export interface UpdateDeliveryZoneDTO {
  districts?: string[];
  deliveryCost?: number;
  estimatedDays?: number;
}

export class UpdateDeliveryZoneUseCase {
  constructor(private readonly deliveryZoneRepository: IDeliveryZoneRepository) {}

  async execute(id: number, dto: UpdateDeliveryZoneDTO): Promise<DeliveryZone> {
    const existing = await this.deliveryZoneRepository.findById(id);
    if (!existing) {
      throw new Error(`Zona de delivery con id ${id} no encontrada`);
    }

    if (dto.districts) {
      for (const district of dto.districts) {
        const distExisting = await this.deliveryZoneRepository.findByDistrict(district);
        if (distExisting && distExisting.id !== id) {
          throw new Error(`El distrito ${district} ya pertenece a otra zona de envío (ID: ${distExisting.id})`);
        }
      }
    }

    return await this.deliveryZoneRepository.update(id, dto);
  }
}
