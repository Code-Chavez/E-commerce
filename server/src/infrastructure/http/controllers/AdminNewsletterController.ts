import { Request, Response, NextFunction } from "express";
import { GetNewsletterSubscribersUseCase } from "@application/use-cases/GetNewsletterSubscribersUseCase";
import { ExportNewsletterSubscribersUseCase } from "@application/use-cases/ExportNewsletterSubscribersUseCase";
import { GetNewsletterSubscribersQuerySchema } from "@application/dtos/NewsletterDTOs";

export class AdminNewsletterController {
  constructor(
    private getNewsletterSubscribersUseCase: GetNewsletterSubscribersUseCase,
    private exportNewsletterSubscribersUseCase: ExportNewsletterSubscribersUseCase
  ) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = GetNewsletterSubscribersQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ success: false, error: validation.error.issues });
      }

      const { page, limit } = validation.data;
      const result = await this.getNewsletterSubscribersUseCase.execute(page, limit);
      
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async export(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = GetNewsletterSubscribersQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ success: false, error: validation.error.issues });
      }

      const format = validation.data.format || 'csv';
      const stream = await this.exportNewsletterSubscribersUseCase.execute(format);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `newsletter_subscribers_${timestamp}`;

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      } else {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      }

      stream.pipe(res);
      stream.on('error', (err) => {
        if (!res.headersSent) {
          next(err);
        } else {
          console.error('Stream error during newsletter export:', err);
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
