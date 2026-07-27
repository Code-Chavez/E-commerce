import prisma from '@infrastructure/database/prisma';
import { IAddressRepository } from '@domain/repositories/IAddressRepository';
import { Address, CreateAddressDTO, UpdateAddressDTO } from '@domain/entities/Address';

export class PrismaAddressRepository implements IAddressRepository {
  private toDomain(record: any): Address {
    return {
      id: record.id,
      userId: record.userId,
      alias: record.alias,
      fullAddress: record.fullAddress,
      district: record.district,
      reference: record.reference ?? null,
      isDefault: record.isDefault,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async findById(id: number): Promise<Address | null> {
    const record = await prisma.address.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByUserId(userId: number): Promise<Address[]> {
    const records = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    });
    return records.map(r => this.toDomain(r));
  }

  async create(userId: number, data: CreateAddressDTO): Promise<Address> {
    const record = await prisma.address.create({
      data: {
        userId,
        alias: data.alias,
        fullAddress: data.fullAddress,
        district: data.district,
        reference: data.reference ?? null,
        isDefault: data.isDefault ?? false,
      },
    });
    return this.toDomain(record);
  }

  async update(id: number, data: UpdateAddressDTO): Promise<Address> {
    const record = await prisma.address.update({
      where: { id },
      data: {
        alias: data.alias,
        fullAddress: data.fullAddress,
        district: data.district,
        reference: data.reference,
        isDefault: data.isDefault,
      },
    });
    return this.toDomain(record);
  }

  async delete(id: number): Promise<void> {
    await prisma.address.delete({
      where: { id },
    });
  }

  async clearDefault(userId: number): Promise<void> {
    await prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  }

  async countByUserId(userId: number): Promise<number> {
    return await prisma.address.count({
      where: { userId },
    });
  }

  async findOldest(userId: number): Promise<Address | null> {
    const record = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return record ? this.toDomain(record) : null;
  }
}
