import { Request, Response, NextFunction } from 'express';
import prisma from '@infrastructure/database/prisma';

export class StockAlertController {
  /**
   * GET /api/v1/stock-alerts
   * Obtiene todas las alertas activas de stock crítico.
   */
  async getActiveAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await prisma.stockAlert.findMany({
        where: { isActive: true },
        include: {
          variant: {
            include: { product: true }
          },
          branch: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ success: true, data: alerts });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/stock-alerts/:id/dismiss
   * Oculta o desactiva manualmente una alerta.
   */
  async dismissAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID inválido' });
      }

      const alert = await prisma.stockAlert.update({
        where: { id },
        data: { isActive: false }
      });

      return res.status(200).json({ success: true, data: alert });
    } catch (error) {
      next(error);
    }
  }
}
