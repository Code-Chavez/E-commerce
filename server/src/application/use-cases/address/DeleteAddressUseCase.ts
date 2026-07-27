import { IAddressRepository } from '@domain/repositories/IAddressRepository';

export class DeleteAddressUseCase {
  constructor(private addressRepository: IAddressRepository) {}

  async execute(userId: number, addressId: number): Promise<void> {
    const address = await this.addressRepository.findById(addressId);
    if (!address || address.userId !== userId) {
      throw new Error('Dirección no encontrada');
    }

    const count = await this.addressRepository.countByUserId(userId);
    if (count <= 1) {
      throw new Error('No puede eliminar su única dirección');
    }

    const wasDefault = address.isDefault;

    // Delete the address
    await this.addressRepository.delete(addressId);

    // If the deleted address was default, promote the oldest remaining address to default
    if (wasDefault) {
      const oldest = await this.addressRepository.findOldest(userId);
      if (oldest) {
        await this.addressRepository.update(oldest.id, { isDefault: true });
      }
    }
  }
}
