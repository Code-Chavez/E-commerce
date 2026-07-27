import { Request, Response, NextFunction } from 'express';
import { CreateBatchCouponsUseCase } from '@application/use-cases/admin/CreateBatchCouponsUseCase';
import { GetAdminCouponsUseCase } from '@application/use-cases/admin/GetAdminCouponsUseCase';

import { z } from 'zod';
import {
  percentage0to100,
  positiveMoney,
  positiveInt,
} from '@shared/validation/documentValidators';

const CreateBatchCouponsSchema = z
  .object({
    prefix: z.string().optional().default('COUPON'),
    quantity: positiveInt.optional().default(1),
    type: z.enum(['PERCENT', 'FIXED']),
    value: z.number().positive('El valor debe ser positivo'),
    minPurchaseAmount: z.number().nonnegative().optional().nullable(),
    specificProductId: z.number().int().positive().optional().nullable(),
    specificCategoryId: z.number().int().positive().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    maxUses: z.number().int().positive().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.type === 'PERCENT' && data.value > 100) {
        return false;
      }
      return true;
    },
    {
      message: 'El porcentaje de descuento no puede exceder el 100%',
      path: ['value'],
    }
  );

export class AdminCouponController {
  constructor(
    private createBatchCouponsUseCase: CreateBatchCouponsUseCase,
    private getAdminCouponsUseCase: GetAdminCouponsUseCase
  ) {}

  async createBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateBatchCouponsSchema.safeParse({
        ...req.body,
        quantity: req.body.quantity ? parseInt(req.body.quantity, 10) : 1,
        value: parseFloat(req.body.value),
        minPurchaseAmount: req.body.minPurchaseAmount
          ? parseFloat(req.body.minPurchaseAmount)
          : undefined,
        specificProductId: req.body.specificProductId
          ? parseInt(req.body.specificProductId, 10)
          : undefined,
        specificCategoryId: req.body.specificCategoryId
          ? parseInt(req.body.specificCategoryId, 10)
          : undefined,
        maxUses: req.body.maxUses ? parseInt(req.body.maxUses, 10) : undefined,
      });

      if (!parsed.success) {
        return res
          .status(400)
          .json({ success: false, error: parsed.error.issues });
      }

      const {
        prefix,
        quantity,
        type,
        value,
        minPurchaseAmount,
        specificProductId,
        specificCategoryId,
        expiresAt,
        maxUses,
      } = parsed.data;

      const result = await this.createBatchCouponsUseCase.execute({
        prefix,
        quantity,
        type,
        value,
        minPurchaseAmount: minPurchaseAmount ?? undefined,
        specificProductId: specificProductId ?? undefined,
        specificCategoryId: specificCategoryId ?? undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        maxUses: maxUses ?? undefined,
      });

      return res.status(201).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      let isActive: boolean | undefined;
      if (req.query.isActive !== undefined) {
        isActive = req.query.isActive === 'true';
      }

      const result = await this.getAdminCouponsUseCase.execute({
        page,
        limit,
        isActive,
      });

      return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      next(error);
    }
  }
}
