import { Request, Response, NextFunction } from 'express';
import { GetCrossBranchStockUseCase } from '@application/use-cases/pos/GetCrossBranchStockUseCase';

const getCrossBranchStockUseCase = new GetCrossBranchStockUseCase();

export class PosStockController {
  /**
   * GET /api/v1/pos/stock/cross-branch?variantId=...
   * Devuelve el stock disponible de la variante especificada en todas las sucursales activas,
   * excluyendo la sucursal del turno de caja abierto actual del vendedor.
   */
  async getCrossBranchStock(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      }

      const variantIdStr = req.query.variantId;
      if (!variantIdStr) {
        return res.status(400).json({
          success: false,
          error: 'El parámetro variantId es obligatorio',
        });
      }

      const variantId = parseInt(String(variantIdStr), 10);
      if (isNaN(variantId) || variantId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El parámetro variantId debe ser un número entero positivo',
        });
      }

      const result = await getCrossBranchStockUseCase.execute(variantId, userId);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.statusCode === 400) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}
