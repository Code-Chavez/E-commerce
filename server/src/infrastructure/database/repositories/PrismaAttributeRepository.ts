import prisma from '@infrastructure/database/prisma';
import { Attribute, AttributeValue } from '@domain/entities/Attribute';

export class PrismaAttributeRepository {
  async findAll(): Promise<Attribute[]> {
    return prisma.attribute.findMany({
      where: { isActive: true },
      include: { values: { where: { isActive: true }, orderBy: { value: 'asc' } } },
      orderBy: { name: 'asc' },
    }) as Promise<Attribute[]>;
  }

  async findById(id: number): Promise<Attribute | null> {
    return prisma.attribute.findUnique({
      where: { id },
      include: { values: true },
    }) as Promise<Attribute | null>;
  }

  async create(name: string, isVisualDriver?: boolean): Promise<Attribute> {
    return prisma.attribute.create({ data: { name, isVisualDriver: isVisualDriver ?? false } }) as Promise<Attribute>;
  }

  async update(id: number, name: string, isVisualDriver?: boolean): Promise<Attribute> {
    return prisma.attribute.update({ where: { id }, data: { name, isVisualDriver } }) as Promise<Attribute>;
  }

  async deactivate(id: number): Promise<void> {
    await prisma.attribute.update({ where: { id }, data: { isActive: false } });
  }

  async addValue(attributeId: number, value: string): Promise<AttributeValue> {
    return prisma.attributeValue.create({ data: { attributeId, value } }) as Promise<AttributeValue>;
  }

  async deactivateValue(valueId: number): Promise<void> {
    await prisma.attributeValue.update({ where: { id: valueId }, data: { isActive: false } });
  }
}
