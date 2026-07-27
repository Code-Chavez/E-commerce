import cron from 'node-cron';
import prisma from '@infrastructure/database/prisma';

const MIN_DAYS_HISTORY = 7;
const SIGMA_THRESHOLD = 2;

function calcStats(values: number[]): { mean: number; stdDev: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  return { mean, stdDev: Math.sqrt(variance) };
}

export class SalesAnomalyJob {
  public static start(): void {
    console.log('[Job] SalesAnomalyJob inicializado (0 2 * * *)');
    cron.schedule('0 2 * * *', async () => {
      console.log('[Job] Ejecutando SalesAnomalyJob...');
      try {
        await SalesAnomalyJob.process();
      } catch (error) {
        console.error('[Job Error] Fallo en SalesAnomalyJob:', error);
      }
    });
  }

  public static async process(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ventana: últimos 31 días (30 días histórico + ayer como día evaluado)
    const window31Start = new Date(today);
    window31Start.setDate(window31Start.getDate() - 31);

    // Obtener todos los items de POS en la ventana
    const items = await prisma.posOrderItem.findMany({
      where: {
        posOrder: {
          createdAt: { gte: window31Start, lt: today },
          status: { not: 'CANCELLED' },
        },
      },
      select: {
        qty: true,
        unitPrice: true,
        posOrder: { select: { branchId: true, createdAt: true } },
        variant: { select: { productId: true } },
      },
    });

    // Agrupar por branchId + productId + día
    type DayKey = string;
    type GroupKey = string;
    const grouped = new Map<GroupKey, Map<DayKey, number>>();

    for (const item of items) {
      const branchId = item.posOrder.branchId;
      const productId = item.variant.productId;
      const day = item.posOrder.createdAt.toISOString().slice(0, 10);
      const revenue = Number(item.unitPrice) * item.qty;

      const groupKey = `${branchId}_${productId}`;
      if (!grouped.has(groupKey)) grouped.set(groupKey, new Map());
      const dayMap = grouped.get(groupKey)!;
      dayMap.set(day, (dayMap.get(day) ?? 0) + revenue);
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let created = 0;
    let resolved = 0;

    for (const [groupKey, dayMap] of grouped.entries()) {
      const [branchIdStr, productIdStr] = groupKey.split('_');
      const branchId = parseInt(branchIdStr, 10);
      const productId = parseInt(productIdStr, 10);

      const yesterdaySales = dayMap.get(yesterdayStr) ?? 0;

      // Historial: todos los días excepto ayer
      const historyValues = Array.from(dayMap.entries())
        .filter(([d]) => d !== yesterdayStr)
        .map(([, v]) => v);

      if (historyValues.length < MIN_DAYS_HISTORY) continue;

      const { mean, stdDev } = calcStats(historyValues);

      // Si desviación estándar es 0 (ventas perfectamente constantes), saltar
      if (stdDev === 0) continue;

      const sigmas = Math.abs(yesterdaySales - mean) / stdDev;

      if (sigmas > SIGMA_THRESHOLD) {
        const direction = yesterdaySales > mean ? 'HIGH' : 'LOW';
        await prisma.salesAnomaly.upsert({
          where: {
            branchId_productId_date: { branchId, productId, date: yesterday },
          },
          create: {
            branchId,
            productId,
            date: yesterday,
            avgSales: mean,
            stdDev,
            actualSales: yesterdaySales,
            sigmas,
            direction,
            isActive: true,
          },
          update: {
            avgSales: mean,
            stdDev,
            actualSales: yesterdaySales,
            sigmas,
            direction,
            isActive: true,
            resolvedAt: null,
          },
        });
        created++;
      } else {
        // Si existía una anomalía activa y ya se normalizó, resolverla
        const existing = await prisma.salesAnomaly.findUnique({
          where: {
            branchId_productId_date: { branchId, productId, date: yesterday },
          },
        });
        if (existing?.isActive) {
          await prisma.salesAnomaly.update({
            where: { id: existing.id },
            data: { isActive: false, resolvedAt: new Date() },
          });
          resolved++;
        }
      }
    }

    console.log(
      `[Job] SalesAnomalyJob: ${created} anomalías detectadas, ${resolved} resueltas automáticamente.`
    );
  }
}
