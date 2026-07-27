import { IAddressRepository } from '@domain/repositories/IAddressRepository';
import { Address } from '@domain/entities/Address';

export class GetUserAddressesUseCase {
  constructor(private addressRepository: IAddressRepository) {}

  async execute(userId: number): Promise<Address[]> {
    return await this.addressRepository.findByUserId(userId);
  }
}
