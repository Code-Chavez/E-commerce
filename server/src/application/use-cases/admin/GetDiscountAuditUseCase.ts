import prisma from '@infrastructure/database/prisma';

export interface DiscountAuditOrder {
  id: number;
  createdAt: Date;
  vendorId: number | null;
  vendorName: string;
  branchId: number;
  branchName: string;
  subtotal: number;
  discountTotal: number;
  total: number;
}

export interface VendorDiscountStat {
  vendorId: number;
  vendorName: string;
  orderCount: number;
  totalDiscount: number;
  avgDiscount: number;
}

export interface DiscountAuditReport {
  from: Date;
  to: Date;
  totalOrders: number;
  totalDiscountAmount: number;
  avgDiscountPerOrder: number;
  orders: DiscountAuditOrder[];
  byVendor: VendorDiscountStat[];
}

export class GetDiscountAuditUseCase {
  async execute(
    from: Date,
    to: Date,
    vendorId?: number,
    branchId?: number,
  ): Promise<DiscountAuditReport> {
    const where: any = {
      discountTotal: { gt: 0 },
      createdAt: { gte: from, lte: to },
    };

    if (vendorId) where.userId = vendorId;
    if (branchId) where.branchId = branchId;

    const posOrders = await prisma.posOrder.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch user names separately since PosOrder.userId is nullable
    const userIds = [...new Set(posOrders.map(o => o.userId).filter((id): id is number => id !== null))];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, lastName: true },
        })
      : [];
    const userMap = new Map(users.map(u => [u.id, `${u.name} ${u.lastName ?? ''}`.trim()]));

    const orders: DiscountAuditOrder[] = posOrders.map(o => ({
      id: o.id,
      createdAt: o.createdAt,
      vendorId: o.userId,
      vendorName: o.userId ? (userMap.get(o.userId) ?? `Usuario #${o.userId}`) : 'Sin asignar',
      branchId: o.branchId,
      branchName: o.branch.name,
      subtotal: Number(o.subtotal),
      discountTotal: Number(o.discountTotal),
      total: Number(o.total),
    }));

    const totalDiscountAmount = orders.reduce((sum, o) => sum + o.discountTotal, 0);
    const avgDiscountPerOrder = orders.length ? totalDiscountAmount / orders.length : 0;

    // Group by vendor
    const vendorMap = new Map<number | null, { name: string; count: number; discount: number }>();
    for (const o of orders) {
      const key = o.vendorId;
      if (!vendorMap.has(key)) {
        vendorMap.set(key, { name: o.vendorName, count: 0, discount: 0 });
      }
      const entry = vendorMap.get(key)!;
      entry.count += 1;
      entry.discount += o.discountTotal;
    }

    const byVendor: VendorDiscountStat[] = Array.from(vendorMap.entries())
      .map(([id, s]) => ({
        vendorId: id ?? 0,
        vendorName: s.name,
        orderCount: s.count,
        totalDiscount: Number(s.discount.toFixed(2)),
        avgDiscount: s.count > 0 ? Number((s.discount / s.count).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.totalDiscount - a.totalDiscount);

    return {
      from,
      to,
      totalOrders: orders.length,
      totalDiscountAmount: Number(totalDiscountAmount.toFixed(2)),
      avgDiscountPerOrder: Number(avgDiscountPerOrder.toFixed(2)),
      orders,
      byVendor,
    };
  }
}
