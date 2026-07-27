import prisma from '@infrastructure/database/prisma';

export interface SellerRankingStat {
  rank: number;
  vendorId: number;
  vendorName: string;
  transactions: number;
  totalVendido: number;
  ticketPromedio: number;
}

export interface SellerRankingReport {
  from: Date;
  to: Date;
  totalSellers: number;
  globalAvgTicket: number;
  topTotalVendido: number;
  sellers: SellerRankingStat[];
}

export class GetSellerRankingUseCase {
  async execute(from: Date, to: Date, branchId?: number): Promise<SellerRankingReport> {
    const where: any = {
      status: 'COMPLETED',
      createdAt: { gte: from, lte: to },
      userId: { not: null },
    };

    if (branchId) where.branchId = branchId;

    const orders = await prisma.posOrder.findMany({
      where,
      select: {
        userId: true,
        total: true,
      },
    });

    if (orders.length === 0) {
      return { from, to, totalSellers: 0, globalAvgTicket: 0, topTotalVendido: 0, sellers: [] };
    }

    // Aggregate by seller
    const sellerMap = new Map<number, { total: number; count: number }>();
    for (const o of orders) {
      if (!o.userId) continue;
      const entry = sellerMap.get(o.userId) ?? { total: 0, count: 0 };
      entry.total += Number(o.total);
      entry.count += 1;
      sellerMap.set(o.userId, entry);
    }

    // Fetch user names
    const userIds = Array.from(sellerMap.keys());
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, lastName: true },
    });
    const userMap = new Map(users.map(u => [u.id, `${u.name} ${u.lastName ?? ''}`.trim()]));

    // Build sorted ranking
    const sorted = Array.from(sellerMap.entries())
      .map(([id, s]) => ({
        vendorId: id,
        vendorName: userMap.get(id) ?? `Usuario #${id}`,
        transactions: s.count,
        totalVendido: Number(s.total.toFixed(2)),
        ticketPromedio: Number((s.total / s.count).toFixed(2)),
      }))
      .sort((a, b) => b.totalVendido - a.totalVendido);

    const sellers: SellerRankingStat[] = sorted.map((s, i) => ({ rank: i + 1, ...s }));

    const globalTotalVendido = sellers.reduce((sum, s) => sum + s.totalVendido, 0);
    const totalTransactions = sellers.reduce((sum, s) => sum + s.transactions, 0);

    return {
      from,
      to,
      totalSellers: sellers.length,
      globalAvgTicket: totalTransactions > 0 ? Number((globalTotalVendido / totalTransactions).toFixed(2)) : 0,
      topTotalVendido: sellers[0]?.totalVendido ?? 0,
      sellers,
    };
  }
}
