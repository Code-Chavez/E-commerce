import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '@infrastructure/database/prisma';
import { requestContext } from '@infrastructure/context/RequestContext';

const AdjustmentSchema = z.object({
  variantId: z.number().int().positive(),
  branchId: z.number().int().positive(),
  newQuantity: z.number().min(0, 'La cantidad no puede ser negativa'),
  reason: z.string().min(10, 'La justificación debe tener al menos 10 caracteres'),
});

export class StockAdjustmentController {
  /**
   * T-106: POST /api/v1/stock/adjustments
   * Solo Admin/Abastecimiento. Actualiza BranchStock y genera asiento AJUSTE en Kardex.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = AdjustmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }

      const { variantId, branchId, newQuantity, reason } = parsed.data;

      const result = await prisma.$transaction(async tx => {
        const current = await tx.branchStock.findUnique({
          where: { variantId_branchId_status: { variantId, branchId, status: 'AVAILABLE' } },
        });

        const prevQty = current?.quantity ?? 0;
        const delta = newQuantity - prevQty;

        const lastEntry = await tx.kardexEntry.findFirst({
          where: { variantId, branchId },
          orderBy: { createdAt: 'desc' },
        });

        const unitCost = lastEntry?.unitCost ?? 0;
        const prevBalanceCost = lastEntry?.balanceCost ?? 0;

        const stock = await tx.branchStock.upsert({
          where: { variantId_branchId_status: { variantId, branchId, status: 'AVAILABLE' } },
          create: { variantId, branchId, quantity: newQuantity, status: 'AVAILABLE' },
          update: { quantity: newQuantity },
        });

        const kardex = await tx.kardexEntry.create({
          data: {
            variantId,
            branchId,
            type: 'AJUSTE',
            quantity: Math.abs(delta),
            unitCost,
            balanceQty: newQuantity,
            balanceCost: prevBalanceCost + delta * unitCost,
            userId: requestContext.getStore()?.userId ?? null,
          },
        });

        return { stock, kardex, delta, reason };
      });

      return res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
  }
}
