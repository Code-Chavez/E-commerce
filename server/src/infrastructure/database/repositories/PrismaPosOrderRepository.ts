import prisma from '@infrastructure/database/prisma';
import { IPosOrderRepository } from '@domain/repositories/IPosOrderRepository';

export class PrismaPosOrderRepository implements IPosOrderRepository {
  async getSalesTotalInRange(start: Date, end: Date): Promise<number> {
    const result = await prisma.posOrder.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        total: true,
      },
    });
    return result._sum.total ? Number(result._sum.total) : 0;
  }

  async getSalesByBranchInRange(start: Date, end: Date): Promise<Array<{ branchId: number; totalSales: number }>> {
    const groups = await prisma.posOrder.groupBy({
      by: ['branchId'],
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        total: true,
      },
    });

    return groups.map((g) => ({
      branchId: g.branchId,
      totalSales: g._sum.total ? Number(g._sum.total) : 0,
    }));
  }

  async findPosOrdersForExport(params: { from?: Date; to?: Date }): Promise<any[]> {
    const { from, to } = params;
    const where: any = {
      status: 'COMPLETED',
    };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }
    const records = await prisma.posOrder.findMany({
      where,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record: any) => ({
      id: record.id,
      status: record.status,
      subtotal: Number(record.subtotal),
      discountTotal: Number(record.discountTotal),
      total: Number(record.total),
      branchName: record.branch.name,
      createdAt: record.createdAt,
      items: record.items.map((item: any) => ({
        id: item.id,
        qty: item.qty,
        unitPrice: Number(item.unitPrice),
        variantSku: item.variant?.sku,
        productName: item.variant?.product?.name,
      })),
    }));
  }

  async getFinancialSales(from?: Date, to?: Date): Promise<Array<{
    amount: number;
    createdAt: Date;
    branchId: number;
    branchName: string;
  }>> {
    const where: any = {
      status: 'COMPLETED',
    };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const records = await prisma.posOrder.findMany({
      where,
      select: {
        total: true,
        createdAt: true,
        branchId: true,
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    return records.map((r) => ({
      amount: Number(r.total),
      createdAt: r.createdAt,
      branchId: r.branchId,
      branchName: r.branch.name,
    }));
  }
}

