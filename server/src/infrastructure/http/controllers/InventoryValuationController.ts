import { Request, Response, NextFunction } from 'express';
import { GetInventoryValuationUseCase } from '@application/use-cases/admin/GetInventoryValuationUseCase';

const useCase = new GetInventoryValuationUseCase();

export class InventoryValuationController {
  getValuation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { branchId } = req.query;
      const parsedBranchId = branchId ? parseInt(String(branchId), 10) : undefined;

      if (branchId && isNaN(parsedBranchId!)) {
        res.status(400).json({ success: false, error: 'branchId debe ser un número entero válido' });
        return;
      }

      const report = await useCase.execute(parsedBranchId);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  };
}
