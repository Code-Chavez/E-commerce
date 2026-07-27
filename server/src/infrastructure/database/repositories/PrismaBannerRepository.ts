import prisma from '@infrastructure/database/prisma';
import { IBannerRepository, CreateBannerDTO, UpdateBannerDTO } from '@domain/repositories/IBannerRepository';
import { Banner } from '@domain/entities/Banner';

export class PrismaBannerRepository implements IBannerRepository {
  async findById(id: number): Promise<Banner | null> {
    const record = await prisma.banner.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<Banner[]> {
    const records = await prisma.banner.findMany({
      orderBy: { order: 'asc' },
    });
    return records.map((r: any) => this.toDomain(r));
  }

  async findAllActiveOrdered(): Promise<Banner[]> {
    const records = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return records.map((r: any) => this.toDomain(r));
  }

  async create(data: CreateBannerDTO): Promise<Banner> {
    // Si no se define el orden, obtenemos el último y sumamos 1
    let order = data.order;
    if (order === undefined) {
      const last = await prisma.banner.findFirst({
        orderBy: { order: 'desc' },
      });
      order = last ? last.order + 1 : 0;
    }

    const record = await prisma.banner.create({
      data: {
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl ?? null,
        order,
      },
    });
    return this.toDomain(record);
  }

  async update(id: number, data: UpdateBannerDTO): Promise<Banner> {
    const record = await prisma.banner.update({
      where: { id },
      data: {
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        order: data.order,
        isActive: data.isActive,
      },
    });
    return this.toDomain(record);
  }

  async delete(id: number): Promise<void> {
    await prisma.banner.delete({ where: { id } });
  }

  async updateOrder(id: number, order: number): Promise<void> {
    await prisma.banner.update({
      where: { id },
      data: { order },
    });
  }

  private toDomain(record: any): Banner {
    return {
      id: record.id,
      imageUrl: record.imageUrl,
      linkUrl: record.linkUrl,
      order: record.order,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
