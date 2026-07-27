import prisma from '@infrastructure/database/prisma';
import { Brand, CreateBrandDTO } from '@domain/entities/Brand';

export class PrismaBrandRepository {
  async findAll(): Promise<Brand[]> {
    return prisma.brand.findMany({ orderBy: { name: 'asc' } }) as Promise<Brand[]>;
  }

  async findById(id: number): Promise<Brand | null> {
    return prisma.brand.findUnique({ where: { id } }) as Promise<Brand | null>;
  }

  async create(data: CreateBrandDTO): Promise<Brand> {
    return prisma.brand.create({ data }) as Promise<Brand>;
  }

  async update(id: number, data: Partial<CreateBrandDTO & { isActive: boolean }>): Promise<Brand> {
    return prisma.brand.update({ where: { id }, data }) as Promise<Brand>;
  }

  async deactivate(id: number): Promise<void> {
    await prisma.brand.update({ where: { id }, data: { isActive: false } });
  }
}
