import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaOrderRepository } from '@infrastructure/database/repositories/PrismaOrderRepository';
import { PrismaPosOrderRepository } from '@infrastructure/database/repositories/PrismaPosOrderRepository';
import { PrismaClientRepository } from '@infrastructure/database/repositories/PrismaClientRepository';
import { PrismaBranchStockRepository } from '@infrastructure/database/repositories/PrismaBranchStockRepository';
import { ExcelReportService } from '@infrastructure/services/ExcelReportService';
import { PDFKitReportService } from '@infrastructure/services/PDFKitReportService';
import { ExportReportUseCase } from '@application/use-cases/admin/ExportReportUseCase';
import { GetLowRotationProductsUseCase } from '@application/use-cases/GetLowRotationProductsUseCase';
import { PrismaReportRepository } from '@infrastructure/database/repositories/PrismaReportRepository';
import { LowRotationQuerySchema } from '@application/dtos/ReportDTOs';
import { CalculateDemandForecastUseCase } from '@application/use-cases/CalculateDemandForecastUseCase';
import { GenerateRestockSuggestionsUseCase } from '@application/use-cases/GenerateRestockSuggestionsUseCase';
import { PrismaDemandForecastRepository } from '@infrastructure/database/repositories/PrismaDemandForecastRepository';

const orderRepository = new PrismaOrderRepository();
const posOrderRepository = new PrismaPosOrderRepository();
const clientRepository = new PrismaClientRepository();
const branchStockRepository = new PrismaBranchStockRepository();
const excelReportService = new ExcelReportService();
const pdfReportService = new PDFKitReportService();
const reportRepository = new PrismaReportRepository();

const exportReportUseCase = new ExportReportUseCase(
  orderRepository,
  posOrderRepository,
  clientRepository,
  branchStockRepository,
  excelReportService,
  pdfReportService
);

const getLowRotationProductsUseCase = new GetLowRotationProductsUseCase(
  reportRepository
);

const demandForecastRepository = new PrismaDemandForecastRepository();
const calculateDemandForecastUseCase = new CalculateDemandForecastUseCase(
  demandForecastRepository
);
const generateRestockSuggestionsUseCase = new GenerateRestockSuggestionsUseCase(
  demandForecastRepository
);

const DemandForecastQuerySchema = z.object({
  months: z.preprocess(
    (val) => (val ? Number(val) : 1),
    z.number().int().min(1, 'Months must be at least 1').default(1)
  ),
});

const ExportReportQuerySchema = z.object({
  type: z.enum(['sales', 'inventory', 'clients'], {
    message: "El tipo de reporte debe ser 'sales', 'inventory' o 'clients'",
  }),
  format: z.enum(['pdf', 'excel', 'csv'], {
    message: "El formato debe ser 'pdf', 'excel' o 'csv'",
  }),
  from: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'La fecha "from" debe tener formato YYYY-MM-DD'
    )
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha "to" debe tener formato YYYY-MM-DD')
    .optional(),
});

export class ReportController {
  async getLowRotationProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validation = LowRotationQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, error: validation.error.issues });
      }

      const products = await getLowRotationProductsUseCase.execute(
        validation.data.days
      );
      return res.status(200).json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }

  async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = ExportReportQuerySchema.safeParse(req.query);
      if (!validation.success) {
        const mappedErrors = validation.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({ success: false, error: mappedErrors });
      }

      const { type, format, from, to } = validation.data;
      const stream = await exportReportUseCase.execute({
        type,
        format,
        from,
        to,
      });

      const dateStr = new Date().toISOString().slice(0, 10);

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="reporte-${type}-${dateStr}.pdf"`
        );
      } else if (format === 'excel') {
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="reporte-${type}-${dateStr}.xlsx"`
        );
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="reporte-${type}-${dateStr}.csv"`
        );
      }

      stream.on('error', (err) => {
        if (!res.headersSent) {
          res
            .status(500)
            .json({ success: false, error: 'Error generating report stream' });
        }
      });

      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  async getDemandForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = DemandForecastQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, error: validation.error.issues });
      }

      const forecasts = await calculateDemandForecastUseCase.execute(
        validation.data.months
      );
      return res.status(200).json({ success: true, data: forecasts });
    } catch (error) {
      next(error);
    }
  }

  async getRestockSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = DemandForecastQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res
          .status(400)
          .json({ success: false, error: validation.error.issues });
      }

      const suggestions = await generateRestockSuggestionsUseCase.execute(
        validation.data.months
      );
      return res.status(200).json({ success: true, data: suggestions });
    } catch (error) {
      next(error);
    }
  }
}
