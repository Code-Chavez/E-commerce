import { Request, Response, NextFunction } from 'express';
import { GetPendingCrossBranchSalesUseCase } from '@application/use-cases/admin/GetPendingCrossBranchSalesUseCase';

const getPendingCrossBranchSalesUseCase = new GetPendingCrossBranchSalesUseCase();

export class CrossBranchMonitorController {
  /**
   * GET /api/v1/admin/cross-branch/pending
   * Listar ventas Cross-Branch con entrega pendiente agrupadas por sucursal de origen.
   */
  async getPendingSales(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await getPendingCrossBranchSalesUseCase.execute();
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }
}
