import { Request, Response, NextFunction } from 'express';
import { GetReceiptsUseCase } from '@application/use-cases/admin/GetReceiptsUseCase';
import { GetPosReceiptPdfUseCase } from '@application/use-cases/admin/GetPosReceiptPdfUseCase';
import { PDFKitPosReceiptService } from '@infrastructure/services/PDFKitPosReceiptService';
import { PDFKitTicketReceiptService } from '@infrastructure/services/PDFKitTicketReceiptService';

const getReceiptsUseCase = new GetReceiptsUseCase();
const getPosReceiptPdfUseCase = new GetPosReceiptPdfUseCase();
const pdfService = new PDFKitPosReceiptService();
const ticketService = new PDFKitTicketReceiptService();

export class ReceiptController {
  /**
   * GET /api/v1/receipts/:id/pdf?format=ticket  (HU-055 T-152)
   * Genera PDF A4 (default) o ticket de 80 mm según el parámetro ?format.
   */
  async getReceiptPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });

      const isTicket = req.query.format === 'ticket';
      const receipt = await getPosReceiptPdfUseCase.execute(id);
      const doc = isTicket ? ticketService.generate(receipt) : pdfService.generate(receipt);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="comprobante-${id}.pdf"`);

      doc.pipe(res);
    } catch (error: any) {
      if (error.message?.includes('no encontrado')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/receipts
   * Listar de manera paginada y filtrada las ventas/comprobantes del sistema POS.
   */
  async getReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = req.query.branchId ? parseInt(String(req.query.branchId), 10) : undefined;
      const type = req.query.type === 'cross-branch' || req.query.type === 'normal' ? req.query.type : undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;

      let from: Date | undefined = undefined;
      if (req.query.from) {
        from = new Date(String(req.query.from));
      }

      let to: Date | undefined = undefined;
      if (req.query.to) {
        to = new Date(String(req.query.to));
        if (!String(req.query.to).includes('T')) {
          to.setHours(23, 59, 59, 999);
        }
      }

      const result = await getReceiptsUseCase.execute({
        branchId,
        from,
        to,
        type,
        page,
        limit,
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }
}
