import { IAddressRepository } from '@domain/repositories/IAddressRepository';
import { Address, CreateAddressDTO } from '@domain/entities/Address';

export class CreateAddressUseCase {
  constructor(private addressRepository: IAddressRepository) {}

  async execute(userId: number, data: CreateAddressDTO): Promise<Address> {
    const count = await this.addressRepository.countByUserId(userId);
    
    let isDefault = data.isDefault ?? false;
    
    // First address must always be default
    if (count === 0) {
      isDefault = true;
    }

    if (isDefault) {
      await this.addressRepository.clearDefault(userId);
    }

    return await this.addressRepository.create(userId, {
      ...data,
      isDefault,
    });
  }
}
