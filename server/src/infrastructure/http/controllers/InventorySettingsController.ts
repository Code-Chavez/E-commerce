import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { InventorySettingsService } from '@application/use-cases/admin/InventorySettingsService';

const UpdateSchema = z.object({
  valuationMethod: z.enum(['PROMEDIO_PONDERADO', 'PEPS']),
});

const service = new InventorySettingsService();

export class InventorySettingsController {
  /** GET /api/v1/admin/inventory-settings */
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getSettings();
      return res.status(200).json({ success: true, data });
    } catch (e) { next(e); }
  }

  /** PUT /api/v1/admin/inventory-settings */
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = UpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }
      const userId = req.auth?.userId;
      const data = await service.updateMethod(parsed.data.valuationMethod, userId);
      return res.status(200).json({ success: true, data });
    } catch (e) { next(e); }
  }
}
