import prisma from '@infrastructure/database/prisma';

export type RFMSegment = 'Champions' | 'Loyal' | 'At Risk' | 'Lost' | 'Promising';

export interface RFMClient {
  userId: number;
  name: string;
  email: string;
  lastOrderDate: Date;
  orderCount: number;
  totalSpent: number;
  recencyDays: number;
  rScore: number;
  fScore: number;
  mScore: number;
  rfmScore: number;
  segment: RFMSegment;
}

export interface RFMSegmentSummary {
  segment: RFMSegment;
  count: number;
  avgRFM: number;
  totalSpent: number;
  avgRecencyDays: number;
  avgFrequency: number;
  color: string;
}

export interface RFMReport {
  clients: RFMClient[];
  segments: RFMSegmentSummary[];
  totalClients: number;
}

const SEGMENT_COLORS: Record<RFMSegment, string> = {
  Champions: '#10b981',
  Loyal: '#3b82f6',
  'At Risk': '#f59e0b',
  Lost: '#ef4444',
  Promising: '#8b5cf6',
};

const ALL_SEGMENTS: RFMSegment[] = ['Champions', 'Loyal', 'At Risk', 'Lost', 'Promising'];

function scoreRecency(days: number): number {
  if (days <= 30) return 5;
  if (days <= 90) return 4;
  if (days <= 180) return 3;
  if (days <= 365) return 2;
  return 1;
}

function scoreFrequency(count: number): number {
  if (count >= 10) return 5;
  if (count >= 6) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  return 1;
}

function scoreMonetary(amount: number, p20: number, p40: number, p60: number, p80: number): number {
  if (amount >= p80) return 5;
  if (amount >= p60) return 4;
  if (amount >= p40) return 3;
  if (amount >= p20) return 2;
  return 1;
}

function classifySegment(r: number, f: number, m: number): RFMSegment {
  if (r >= 4 && f >= 4) return 'Champions';
  if (f >= 3 && m >= 3) return 'Loyal';
  if (r <= 2 && (f >= 2 || m >= 2)) return 'At Risk';
  if (r <= 2 && f <= 1) return 'Lost';
  return 'Promising';
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)];
}

export class GetRFMSegmentsUseCase {
  async execute(segment?: RFMSegment): Promise<RFMReport> {
    const now = new Date();

    const orderData = await prisma.order.groupBy({
      by: ['userId'],
      where: { status: { in: ['PAID', 'DELIVERED', 'SHIPPED'] } },
      _count: { id: true },
      _sum: { total: true },
      _max: { createdAt: true },
    });

    if (orderData.length === 0) {
      return {
        clients: [],
        segments: ALL_SEGMENTS.map(seg => ({
          segment: seg, count: 0, avgRFM: 0, totalSpent: 0,
          avgRecencyDays: 0, avgFrequency: 0, color: SEGMENT_COLORS[seg],
        })),
        totalClients: 0,
      };
    }

    const amounts = orderData
      .map(o => Number(o._sum.total ?? 0))
      .sort((a, b) => a - b);

    const p20 = percentile(amounts, 0.2);
    const p40 = percentile(amounts, 0.4);
    const p60 = percentile(amounts, 0.6);
    const p80 = percentile(amounts, 0.8);

    const userIds = orderData.map(o => o.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, lastName: true, email: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const allClients: RFMClient[] = orderData.map(o => {
      const user = userMap.get(o.userId);
      const lastOrder = o._max.createdAt!;
      const recencyDays = Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24));
      const orderCount = o._count.id;
      const totalSpent = Number(o._sum.total ?? 0);

      const rScore = scoreRecency(recencyDays);
      const fScore = scoreFrequency(orderCount);
      const mScore = scoreMonetary(totalSpent, p20, p40, p60, p80);

      return {
        userId: o.userId,
        name: user ? `${user.name ?? ''} ${user.lastName ?? ''}`.trim() || `Usuario #${o.userId}` : `Usuario #${o.userId}`,
        email: user?.email ?? '',
        lastOrderDate: lastOrder,
        orderCount,
        totalSpent,
        recencyDays,
        rScore,
        fScore,
        mScore,
        rfmScore: rScore + fScore + mScore,
        segment: classifySegment(rScore, fScore, mScore),
      };
    });

    const segments: RFMSegmentSummary[] = ALL_SEGMENTS.map(seg => {
      const sc = allClients.filter(c => c.segment === seg);
      return {
        segment: seg,
        count: sc.length,
        avgRFM: sc.length ? sc.reduce((s, c) => s + c.rfmScore, 0) / sc.length : 0,
        totalSpent: sc.reduce((s, c) => s + c.totalSpent, 0),
        avgRecencyDays: sc.length ? sc.reduce((s, c) => s + c.recencyDays, 0) / sc.length : 0,
        avgFrequency: sc.length ? sc.reduce((s, c) => s + c.orderCount, 0) / sc.length : 0,
        color: SEGMENT_COLORS[seg],
      };
    });

    const clients = segment ? allClients.filter(c => c.segment === segment) : allClients;

    return { clients, segments, totalClients: allClients.length };
  }
}
