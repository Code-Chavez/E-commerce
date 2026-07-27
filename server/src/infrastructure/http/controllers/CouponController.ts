import { Request, Response } from 'express';
import { ValidateCouponUseCase } from '../../../application/use-cases/coupon/ValidateCouponUseCase';

export class CouponController {
  constructor(private validateCouponUseCase: ValidateCouponUseCase) {}

  public validate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, subtotal } = req.body;

      if (!code || typeof subtotal !== 'number') {
        res.status(400).json({ error: 'El código y el subtotal son requeridos y deben tener un formato válido.' });
        return;
      }

      const result = await this.validateCouponUseCase.execute({ code, subtotal });

      if (!result.valid) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('[CouponController] validate error:', error);
      res.status(500).json({ error: 'Error interno del servidor.' });
    }
  };
}
