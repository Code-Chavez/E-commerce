import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaOrderRepository } from '@infrastructure/database/repositories/PrismaOrderRepository';
import { ProfitabilityCalculatorService } from '@domain/services/ProfitabilityCalculatorService';
import { GetProfitabilityReportUseCase } from '@application/use-cases/admin/GetProfitabilityReportUseCase';

const orderRepository = new PrismaOrderRepository();
const profitabilityCalculator = new ProfitabilityCalculatorService();
const getProfitabilityReportUseCase = new GetProfitabilityReportUseCase(
  orderRepository,
  profitabilityCalculator
);

const GetProfitabilityReportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha "from" debe tener formato YYYY-MM-DD').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha "to" debe tener formato YYYY-MM-DD').optional(),
  groupBy: z.enum(['brand', 'category'], {
    message: "El parámetro groupBy debe ser 'brand' o 'category'",
  }),
});

export class GetProfitabilityReportController {
  async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = GetProfitabilityReportQuerySchema.safeParse(req.query);
      if (!validation.success) {
        const mappedErrors = validation.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({ success: false, error: mappedErrors });
      }

      const { from, to, groupBy } = validation.data;
      const report = await getProfitabilityReportUseCase.execute({
        from,
        to,
        groupBy,
      });

      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}
