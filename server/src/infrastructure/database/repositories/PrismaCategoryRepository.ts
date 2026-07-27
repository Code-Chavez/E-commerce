import prisma from '@infrastructure/database/prisma';
import { Category, CreateCategoryDTO } from '@domain/entities/Category';

export class PrismaCategoryRepository {
  async findAll(): Promise<Category[]> {
    const records = await prisma.category.findMany({
      where: { isActive: true },
      include: { children: { where: { isActive: true } } },
      orderBy: { name: 'asc' },
    });
    return records as Category[];
  }

  async findById(id: number): Promise<Category | null> {
    const record = await prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });
    return record as Category | null;
  }

  async create(data: CreateCategoryDTO & { imageUrl?: string }): Promise<Category> {
    const record = await prisma.category.create({
      data: {
        name: data.name,
        parentId: data.parentId ?? null,
        sizeGuideUrl: data.sizeGuideUrl ?? null,
        imageUrl: data.imageUrl ?? null,
      },
    });
    return record as Category;
  }

  async update(id: number, data: Partial<CreateCategoryDTO & { imageUrl?: string | null }>): Promise<Category> {
    const record = await prisma.category.update({
      where: { id },
      data,
    });
    return record as Category;
  }

  async deactivate(id: number): Promise<void> {
    await prisma.category.update({ where: { id }, data: { isActive: false } });
  }
}
