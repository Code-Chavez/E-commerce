import prisma from '@infrastructure/database/prisma';
import { IPriceHistoryRepository } from '@domain/repositories/IPriceHistoryRepository';
import { PriceHistory, CreatePriceHistoryDTO } from '@domain/entities/PriceHistory';

export class PrismaPriceHistoryRepository implements IPriceHistoryRepository {
  async create(data: CreatePriceHistoryDTO): Promise<PriceHistory> {
    const record = await prisma.priceHistory.create({
      data: {
        variantId: data.variantId,
        userId: data.userId,
        priceType: data.priceType ?? 'SALE',
        oldPrice: data.oldPrice,
        newPrice: data.newPrice,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.toDomain(record);
  }

  async findByProductId(productId: number): Promise<PriceHistory[]> {
    const records = await prisma.priceHistory.findMany({
      where: {
        variant: {
          productId: productId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map(r => this.toDomain(r));
  }

  async findByVariantId(variantId: number): Promise<PriceHistory[]> {
    const records = await prisma.priceHistory.findMany({
      where: {
        variantId: variantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map(r => this.toDomain(r));
  }

  private toDomain(record: any): PriceHistory {
    return {
      id: record.id,
      variantId: record.variantId,
      userId: record.userId,
      priceType: record.priceType ?? 'SALE',
      oldPrice: Number(record.oldPrice),
      newPrice: Number(record.newPrice),
      createdAt: record.createdAt,
      user: record.user ? {
        id: record.user.id,
        name: record.user.name,
        email: record.user.email,
      } : null,
    };
  }
}
