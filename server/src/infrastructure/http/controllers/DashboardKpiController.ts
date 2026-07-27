import { Request, Response, NextFunction } from 'express';
import { GetDashboardKpisUseCase } from '@application/use-cases/admin/GetDashboardKpisUseCase';
import { PrismaOrderRepository } from '@infrastructure/database/repositories/PrismaOrderRepository';
import { PrismaPosOrderRepository } from '@infrastructure/database/repositories/PrismaPosOrderRepository';
import { PrismaStockAlertRepository } from '@infrastructure/database/repositories/PrismaStockAlertRepository';
import { PrismaBranchRepository } from '@infrastructure/database/repositories/PrismaBranchRepository';

export class DashboardKpiController {
  async getKpis(req: Request, res: Response, next: NextFunction) {
    try {
      const orderRepo = new PrismaOrderRepository();
      const posOrderRepo = new PrismaPosOrderRepository();
      const stockAlertRepo = new PrismaStockAlertRepository();
      const branchRepo = new PrismaBranchRepository();

      const useCase = new GetDashboardKpisUseCase(
        orderRepo,
        posOrderRepo,
        stockAlertRepo,
        branchRepo
      );

      const kpis = await useCase.execute();

      return res.status(200).json({
        success: true,
        data: kpis,
      });
    } catch (error) {
      next(error);
    }
  }
}
