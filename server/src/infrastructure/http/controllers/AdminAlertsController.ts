import { Request, Response, NextFunction } from 'express';
import { GetPendingOrderAlertsUseCase } from '@application/use-cases/admin/GetPendingOrderAlertsUseCase';
import prisma from '@infrastructure/database/prisma';

export class AdminAlertsController {
  private getPendingOrderAlertsUseCase: GetPendingOrderAlertsUseCase;

  constructor() {
    this.getPendingOrderAlertsUseCase = new GetPendingOrderAlertsUseCase();
  }

  getPendingOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getPendingOrderAlertsUseCase.execute();
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getAutoReturnAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const alerts = await prisma.failedDeliveryReturnAlert.findMany({
        where: { isActive: true },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { autoReturnedAt: 'desc' },
      });
      res.status(200).json({ success: true, data: alerts });
    } catch (error) {
      next(error);
    }
  };

  dismissAutoReturnAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'ID inválido' });
        return;
      }
      await prisma.failedDeliveryReturnAlert.update({
        where: { id },
        data: { isActive: false },
      });
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
