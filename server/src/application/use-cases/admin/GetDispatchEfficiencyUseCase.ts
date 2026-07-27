import prisma from '@infrastructure/database/prisma';

export interface DriverStat {
  deliveryManId: number;
  name: string;
  total: number;
  delivered: number;
  failed: number;
  successRate: number;
  avgDeliveryMinutes: number | null;
}

export interface DispatchEfficiencyReport {
  from: Date;
  to: Date;
  totalDeliveries: number;
  delivered: number;
  failed: number;
  successRate: number;
  failureRate: number;
  avgDeliveryMinutes: number | null;
  byDriver: DriverStat[];
}

export class GetDispatchEfficiencyUseCase {
  async execute(from: Date, to: Date): Promise<DispatchEfficiencyReport> {
    const deliveries = await prisma.delivery.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        deliveryManId: { not: null },
      },
      include: {
        deliveryMan: { select: { id: true, name: true, lastName: true } },
      },
    });

    const total = deliveries.length;
    const deliveredList = deliveries.filter(d => d.status === 'DELIVERED' && d.deliveredAt);
    const failedList = deliveries.filter(d => d.status === 'FAILED');

    const minutesDiffs = deliveredList
      .map(d => (d.deliveredAt!.getTime() - d.createdAt.getTime()) / 60000)
      .filter(m => m > 0);

    const avgDeliveryMinutes = minutesDiffs.length
      ? Math.round(minutesDiffs.reduce((a, b) => a + b, 0) / minutesDiffs.length)
      : null;

    const driverMap = new Map<number, {
      name: string;
      total: number;
      delivered: number;
      failed: number;
      minutes: number[];
    }>();

    for (const d of deliveries) {
      if (!d.deliveryManId || !d.deliveryMan) continue;

      const id = d.deliveryManId;
      if (!driverMap.has(id)) {
        const fullName = [d.deliveryMan.name, (d.deliveryMan as any).lastName]
          .filter(Boolean).join(' ');
        driverMap.set(id, { name: fullName, total: 0, delivered: 0, failed: 0, minutes: [] });
      }

      const entry = driverMap.get(id)!;
      entry.total += 1;

      if (d.status === 'DELIVERED' && d.deliveredAt) {
        entry.delivered += 1;
        const mins = (d.deliveredAt.getTime() - d.createdAt.getTime()) / 60000;
        if (mins > 0) entry.minutes.push(mins);
      } else if (d.status === 'FAILED') {
        entry.failed += 1;
      }
    }

    const byDriver: DriverStat[] = Array.from(driverMap.entries()).map(([deliveryManId, s]) => ({
      deliveryManId,
      name: s.name,
      total: s.total,
      delivered: s.delivered,
      failed: s.failed,
      successRate: s.total > 0 ? Math.round((s.delivered / s.total) * 100) : 0,
      avgDeliveryMinutes: s.minutes.length
        ? Math.round(s.minutes.reduce((a, b) => a + b, 0) / s.minutes.length)
        : null,
    })).sort((a, b) => b.successRate - a.successRate);

    return {
      from,
      to,
      totalDeliveries: total,
      delivered: deliveredList.length,
      failed: failedList.length,
      successRate: total > 0 ? Math.round((deliveredList.length / total) * 100) : 0,
      failureRate: total > 0 ? Math.round((failedList.length / total) * 100) : 0,
      avgDeliveryMinutes,
      byDriver,
    };
  }
}
