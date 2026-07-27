import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '@infrastructure/database/prisma';

const QuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  branchId: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export class InventoryReportController {
  /**
   * T-111: GET /api/v1/reports/inventory-rotation?from=&to=&branchId=
   * Groups KardexEntry by variant, calculates: sold units, stock days, rotation ratio.
   *
   * rotation ratio = unitsSold / avgStock
   * stockDays = periodDays / rotationRatio  (0 if no sales)
   */
  async inventoryRotation(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = QuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }

      const { from, to, branchId } = parsed.data;
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const periodDays = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));

      const entries = await prisma.kardexEntry.findMany({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
          ...(branchId ? { branchId } : {}),
        },
        include: {
          variant: { select: { sku: true, product: { select: { name: true } } } },
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      const map = new Map<string, {
        variantId: number; sku: string; productName: string;
        branchId: number; branchName: string;
        unitsSold: number; openingQty: number; closingQty: number;
      }>();

      for (const e of entries) {
        const key = `${e.variantId}-${e.branchId}`;
        if (!map.has(key)) {
          map.set(key, {
            variantId: e.variantId,
            sku: e.variant.sku,
            productName: e.variant.product.name,
            branchId: e.branchId,
            branchName: e.branch.name,
            unitsSold: 0,
            openingQty: e.balanceQty,
            closingQty: e.balanceQty,
          });
        }
        const row = map.get(key)!;
        if (e.type === 'VENTA') row.unitsSold += e.quantity;
        row.closingQty = e.balanceQty;
      }

      const report = Array.from(map.values()).map(row => {
        const avgStock = (row.openingQty + row.closingQty) / 2;
        const rotationRatio = avgStock > 0 ? Math.round((row.unitsSold / avgStock) * 100) / 100 : 0;
        const stockDays = rotationRatio > 0 ? Math.round(periodDays / rotationRatio) : null;
        return { ...row, avgStock, rotationRatio, stockDays, periodDays };
      });

      return res.status(200).json({ success: true, data: report });
    } catch (e) { next(e); }
  }
}
