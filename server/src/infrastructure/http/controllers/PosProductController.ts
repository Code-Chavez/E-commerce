import { Request, Response, NextFunction } from 'express';
import { PrismaPosProductRepository } from '@infrastructure/database/repositories/PrismaPosProductRepository';
import { SearchPosProductUseCase } from '@application/use-cases/pos/SearchPosProductUseCase';

const posProductRepository = new PrismaPosProductRepository();
const searchUseCase = new SearchPosProductUseCase(posProductRepository);

export class PosProductController {
  /**
   * GET /api/v1/pos/products?sku=...
   * Busca productos/variantes para el POS por SKU o nombre de producto,
   * retornando el stock correspondiente a la sucursal del turno activo del usuario.
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      }

      // El frontend puede enviar el término en 'sku' o generalizado en 'q'
      const query = String(req.query.sku || req.query.q || '').trim();
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'El parámetro de búsqueda (sku) es requerido y no puede estar vacío',
        });
      }

      const results = await searchUseCase.execute(query, userId);
      return res.status(200).json({ success: true, data: results });
    } catch (error: any) {
      if (error.message?.includes('turno de caja') || error.message?.includes('abre caja')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}
