import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaOrderRepository } from '@infrastructure/database/repositories/PrismaOrderRepository';
import { PrismaPosOrderRepository } from '@infrastructure/database/repositories/PrismaPosOrderRepository';
import { FinancialConsolidationService } from '@domain/services/FinancialConsolidationService';
import { GetFinancialDashboardUseCase } from '@application/use-cases/admin/GetFinancialDashboardUseCase';

const orderRepository = new PrismaOrderRepository();
const posOrderRepository = new PrismaPosOrderRepository();
const consolidationService = new FinancialConsolidationService();
const getFinancialDashboardUseCase = new GetFinancialDashboardUseCase(
  orderRepository,
  posOrderRepository,
  consolidationService
);

const GetFinancialDashboardQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha "from" debe tener formato YYYY-MM-DD')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha "to" debe tener formato YYYY-MM-DD')
    .optional(),
});

export class GetFinancialDashboardController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = GetFinancialDashboardQuerySchema.safeParse(req.query);
      if (!validation.success) {
        const mappedErrors = validation.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({ success: false, error: mappedErrors });
      }

      const { from, to } = validation.data;
      const dashboard = await getFinancialDashboardUseCase.execute({
        from,
        to,
      });

      return res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }
}
