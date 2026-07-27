import prisma from '@infrastructure/database/prisma';

export interface SalesAnomalyItem {
  id: number;
  branchId: number;
  branchName: string;
  productId: number;
  productName: string;
  date: Date;
  avgSales: number;
  stdDev: number;
  actualSales: number;
  sigmas: number;
  direction: 'HIGH' | 'LOW';
  isActive: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
}

export class GetSalesAnomaliesUseCase {
  async execute(onlyActive = true): Promise<SalesAnomalyItem[]> {
    const anomalies = await prisma.salesAnomaly.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      include: {
        branch: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: [{ isActive: 'desc' }, { date: 'desc' }],
    });

    return anomalies.map((a) => ({
      id: a.id,
      branchId: a.branchId,
      branchName: a.branch.name,
      productId: a.productId,
      productName: a.product.name,
      date: a.date,
      avgSales: Number(a.avgSales),
      stdDev: Number(a.stdDev),
      actualSales: Number(a.actualSales),
      sigmas: Number(a.sigmas),
      direction: a.direction as 'HIGH' | 'LOW',
      isActive: a.isActive,
      resolvedAt: a.resolvedAt,
      createdAt: a.createdAt,
    }));
  }
}
