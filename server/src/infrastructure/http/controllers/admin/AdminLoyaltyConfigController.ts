import { Request, Response } from 'express';
import { GetLoyaltyConfigUseCase } from '../../../../application/use-cases/loyalty/GetLoyaltyConfigUseCase';
import { UpdateLoyaltyConfigUseCase } from '../../../../application/use-cases/loyalty/UpdateLoyaltyConfigUseCase';

export class AdminLoyaltyConfigController {
  private getLoyaltyConfigUseCase: GetLoyaltyConfigUseCase;
  private updateLoyaltyConfigUseCase: UpdateLoyaltyConfigUseCase;

  constructor() {
    this.getLoyaltyConfigUseCase = new GetLoyaltyConfigUseCase();
    this.updateLoyaltyConfigUseCase = new UpdateLoyaltyConfigUseCase();
  }

  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const role = req.auth?.role;
      if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
        res.status(403).json({ success: false, error: 'Acceso denegado. Se requiere rol de administrador.' });
        return;
      }

      const config = await this.getLoyaltyConfigUseCase.execute();
      res.status(200).json({ success: true, data: config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Error interno al obtener configuración de lealtad' });
    }
  }

  async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const role = req.auth?.role;
      if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
        res.status(403).json({ success: false, error: 'Acceso denegado. Se requiere rol de administrador.' });
        return;
      }

      const { solesPerPoint } = req.body;
      const config = await this.updateLoyaltyConfigUseCase.execute({ solesPerPoint: Number(solesPerPoint) });
      res.status(200).json({ success: true, data: config });
    } catch (error: any) {
      if (error.message.includes('mayor a 0')) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: 'Error interno al actualizar configuración de lealtad' });
    }
  }
}
