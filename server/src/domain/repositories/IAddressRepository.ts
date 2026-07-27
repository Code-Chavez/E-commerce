import { Address, CreateAddressDTO, UpdateAddressDTO } from '@domain/entities/Address';

export interface IAddressRepository {
  findById(id: number): Promise<Address | null>;
  findByUserId(userId: number): Promise<Address[]>;
  create(userId: number, data: CreateAddressDTO): Promise<Address>;
  update(id: number, data: UpdateAddressDTO): Promise<Address>;
  delete(id: number): Promise<void>;
  clearDefault(userId: number): Promise<void>;
  countByUserId(userId: number): Promise<number>;
  findOldest(userId: number): Promise<Address | null>;
}
