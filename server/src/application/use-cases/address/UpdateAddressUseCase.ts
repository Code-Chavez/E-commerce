import { IAddressRepository } from '@domain/repositories/IAddressRepository';
import { Address, UpdateAddressDTO } from '@domain/entities/Address';

export class UpdateAddressUseCase {
  constructor(private addressRepository: IAddressRepository) {}

  async execute(userId: number, addressId: number, data: UpdateAddressDTO): Promise<Address> {
    const address = await this.addressRepository.findById(addressId);
    if (!address || address.userId !== userId) {
      throw new Error('Dirección no encontrada');
    }

    const totalCount = await this.addressRepository.countByUserId(userId);

    // If user is trying to set isDefault = false on the default address
    if (data.isDefault === false && address.isDefault) {
      if (totalCount === 1) {
        throw new Error('No puede quitar el estado predeterminado de su única dirección');
      } else {
        throw new Error('Debe marcar otra dirección como predeterminada en su lugar');
      }
    }

    // If setting isDefault to true, clear other defaults
    if (data.isDefault === true) {
      await this.addressRepository.clearDefault(userId);
    }

    return await this.addressRepository.update(addressId, data);
  }
}
