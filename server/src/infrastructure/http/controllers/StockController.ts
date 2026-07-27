import { Request, Response, NextFunction } from 'express';
import { PrismaBranchStockRepository } from '@infrastructure/database/repositories/PrismaBranchStockRepository';
import { GetStockReportUseCase } from '@application/use-cases/inventory/GetStockReportUseCase';
import { StockFilter } from '@domain/repositories/IBranchStockRepository';

// Composición de dependencias (DI manual)
const branchStockRepository = new PrismaBranchStockRepository();
const getStockReportUseCase = new GetStockReportUseCase(branchStockRepository);

export class StockController {
  /**
   * GET /api/v1/stock
   *
   * Consulta el stock global y el desglose por sucursal de las variantes.
   * Filtros opcionales: variantId, branchId, sku.
   */
  async getStock(req: Request, res: Response, next: NextFunction) {
    try {
      const filter: StockFilter = {};

      if (req.query.variantId) {
        const parsedVariantId = parseInt(String(req.query.variantId), 10);
        if (!isNaN(parsedVariantId)) {
          filter.variantId = parsedVariantId;
        }
      }

      if (req.query.branchId) {
        const parsedBranchId = parseInt(String(req.query.branchId), 10);
        if (!isNaN(parsedBranchId)) {
          filter.branchId = parsedBranchId;
        }
      }

      if (req.query.sku && typeof req.query.sku === 'string' && req.query.sku.trim() !== '') {
        filter.sku = req.query.sku.trim();
      }

      const report = await getStockReportUseCase.execute(filter);
      return res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }
}
