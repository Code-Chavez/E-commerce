import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CreateStockTransferUseCase } from '@application/use-cases/inventory/CreateStockTransferUseCase';
import { GenerateTransferGuideUseCase } from '@application/use-cases/inventory/GenerateTransferGuideUseCase';
import { PDFKitTransferGuideService } from '@infrastructure/services/PDFKitTransferGuideService';

const CreateTransferSchema = z.object({
  fromBranchId: z.number().int().positive('La sucursal de origen debe ser un ID válido'),
  toBranchId: z.number().int().positive('La sucursal de destino debe ser un ID válido'),
  variantId: z.number().int().positive('La variante del producto debe ser un ID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor a cero'),
});

const createStockTransferUseCase = new CreateStockTransferUseCase();
const generateTransferGuideUseCase = new GenerateTransferGuideUseCase();
const pdfKitTransferGuideService = new PDFKitTransferGuideService();

export class StockTransferController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateTransferSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: parsed.error.issues,
        });
      }

      const result = await createStockTransferUseCase.execute(parsed.data);

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.statusCode === 400) {
        return res.status(400).json({ success: false, error: error.message });
      }
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  async getGuide(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID de transferencia inválido' });
      }

      const data = await generateTransferGuideUseCase.execute(id);

      // Injectar responsable desde la solicitud autenticada si es posible
      if ((req as any).auth?.name) {
        data.requestedBy = { 
          name: (req as any).auth.name, 
          lastName: (req as any).auth.lastName || null 
        };
      }

      const doc = pdfKitTransferGuideService.generate(data);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="guia-transferencia-${id}.pdf"`);

      doc.pipe(res);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}
