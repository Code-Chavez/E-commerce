import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '@infrastructure/database/prisma';

const KARDEX_TYPES = ['COMPRA', 'VENTA', 'TRANSFERENCIA', 'DEVOLUCION', 'AJUSTE'] as const;

const QuerySchema = z.object({
  variantId: z.string().regex(/^\d+$/).transform(Number),
  branchId: z.string().regex(/^\d+$/).transform(Number),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  type: z.enum(KARDEX_TYPES).optional(),
});

export class KardexController {
  /**
   * T-102: GET /api/v1/kardex?variantId=&branchId=&from=&to=
   * Returns all KardexEntry rows with accumulated balance and historical unit cost.
   */
  async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = QuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }

      const { variantId, branchId, from, to, type } = parsed.data;

      const entries = await prisma.kardexEntry.findMany({
        where: {
          variantId,
          branchId,
          ...(type ? { type } : {}),
          ...(from || to ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          } : {}),
        },
        orderBy: { createdAt: 'asc' },
        include: {
          variant: { select: { sku: true, price: true } },
          branch: { select: { name: true } },
          user: { select: { name: true, lastName: true, email: true } },
        },
      });

      return res.status(200).json({
        success: true,
        data: entries.map(e => ({
          id: e.id,
          type: e.type,
          quantity: e.quantity,
          unitCost: e.unitCost,
          salePrice: Number(e.variant.price),
          balanceQty: e.balanceQty,
          balanceCost: e.balanceCost,
          sku: e.variant.sku,
          branch: e.branch.name,
          userName: e.user ? `${e.user.name} ${e.user.lastName || ''}`.trim() || e.user.email : null,
          createdAt: e.createdAt,
        })),
      });
    } catch (e) { next(e); }
  }
}
