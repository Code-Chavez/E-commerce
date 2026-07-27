import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createReturnRequestSchema = z.object({
  orderId: z.number().int().positive(),
  reason: z.string().trim().min(5, 'Reason must be at least 5 characters long'),
  refundType: z.enum(['CREDIT_NOTE', 'STORE_CREDIT']),
  items: z
    .array(
      z.object({
        orderItemId: z.number().int().positive(),
        qty: z.number().int().positive(),
      })
    )
    .min(1, 'At least one item must be returned'),
});

export const validateCreateReturnRequest = (req: Request, res: Response, next: NextFunction): void => {
  const result = createReturnRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
    return;
  }
  next();
};
