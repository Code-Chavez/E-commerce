import { IDeliveryZoneRepository } from '../../../domain/repositories/IDeliveryZoneRepository';

export class DeleteDeliveryZoneUseCase {
  constructor(private readonly deliveryZoneRepository: IDeliveryZoneRepository) {}

  async execute(id: number): Promise<void> {
    const existing = await this.deliveryZoneRepository.findById(id);
    if (!existing) {
      throw new Error(`Zona de delivery con id ${id} no encontrada`);
    }

    await this.deliveryZoneRepository.delete(id);
  }
}
