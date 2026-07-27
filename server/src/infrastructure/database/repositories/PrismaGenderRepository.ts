import prisma from '@infrastructure/database/prisma';
import { Gender, CreateGenderDTO, UpdateGenderDTO } from '@domain/entities/Gender';
import { IGenderRepository } from '@domain/repositories/IGenderRepository';

export class PrismaGenderRepository implements IGenderRepository {
  async findById(id: number): Promise<Gender | null> {
    const record = await prisma.gender.findUnique({
      where: { id },
    });
    return record as Gender | null;
  }

  async findAll(): Promise<Gender[]> {
    const records = await prisma.gender.findMany({
      orderBy: { name: 'asc' },
    });
    return records as Gender[];
  }

  async findAllActive(): Promise<Gender[]> {
    const records = await prisma.gender.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return records as Gender[];
  }

  async create(data: CreateGenderDTO): Promise<Gender> {
    const record = await prisma.gender.create({
      data: {
        name: data.name,
        isActive: true,
      },
    });
    return record as Gender;
  }

  async update(id: number, data: UpdateGenderDTO): Promise<Gender> {
    const record = await prisma.gender.update({
      where: { id },
      data,
    });
    return record as Gender;
  }

  async delete(id: number): Promise<void> {
    await prisma.gender.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
