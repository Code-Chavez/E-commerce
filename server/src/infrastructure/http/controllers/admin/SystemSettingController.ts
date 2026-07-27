import { Request, Response, NextFunction } from 'express';
import { PrismaSystemSettingRepository } from '@infrastructure/database/repositories/PrismaSystemSettingRepository';
import { GetSystemSettingsUseCase } from '@application/use-cases/admin/GetSystemSettingsUseCase';
import { UpdateSystemSettingUseCase } from '@application/use-cases/admin/UpdateSystemSettingUseCase';

export class SystemSettingController {
  private repository = new PrismaSystemSettingRepository();
  private getSettingsUseCase = new GetSystemSettingsUseCase(this.repository);
  private updateSettingUseCase = new UpdateSystemSettingUseCase(this.repository);

  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await this.getSettingsUseCase.execute();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const adminId = (req as any).auth?.userId;

      if (!adminId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      if (!value) {
        return res.status(400).json({ message: 'El valor es requerido' });
      }

      const updated = await this.updateSettingUseCase.execute(adminId, key as string, value.toString());
      res.json(updated);
    } catch (error: any) {
      if (error.status === 400) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  };
}
