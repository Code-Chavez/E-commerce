import { Request, Response, NextFunction } from 'express';
import { GetDispatchEfficiencyUseCase } from '@application/use-cases/admin/GetDispatchEfficiencyUseCase';

const useCase = new GetDispatchEfficiencyUseCase();

export class DispatchReportController {
  getEfficiency = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        res.status(400).json({ success: false, error: 'Los parámetros from y to son requeridos' });
        return;
      }

      const fromDate = new Date(String(from));
      const toDate = new Date(String(to));

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        res.status(400).json({ success: false, error: 'Formato de fecha inválido' });
        return;
      }

      if (fromDate > toDate) {
        res.status(400).json({ success: false, error: 'La fecha de inicio no puede ser mayor a la fecha de fin' });
        return;
      }

      toDate.setHours(23, 59, 59, 999);

      const report = await useCase.execute(fromDate, toDate);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  };
}
