import { Request, Response, NextFunction } from 'express';
import { GetSalesAnomaliesUseCase } from '@application/use-cases/admin/GetSalesAnomaliesUseCase';
import prisma from '@infrastructure/database/prisma';

const getUseCase = new GetSalesAnomaliesUseCase();

export class SalesAnomalyController {
  getAnomalies = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const onlyActive = req.query.onlyActive !== 'false';
      const anomalies = await getUseCase.execute(onlyActive);
      res.status(200).json({ success: true, data: anomalies });
    } catch (error) {
      next(error);
    }
  };

  resolveAnomaly = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const updated = await prisma.salesAnomaly.update({
        where: { id },
        data: { isActive: false, resolvedAt: new Date() },
      });
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };
}
