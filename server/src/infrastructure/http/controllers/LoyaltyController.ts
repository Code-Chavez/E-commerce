import { Request, Response } from 'express';
import { RedeemLoyaltyPointsUseCase } from '../../../application/use-cases/loyalty/RedeemLoyaltyPointsUseCase';
import prisma from '../../database/prisma';

export class LoyaltyController {
  private redeemLoyaltyPointsUseCase: RedeemLoyaltyPointsUseCase;

  constructor() {
    this.redeemLoyaltyPointsUseCase = new RedeemLoyaltyPointsUseCase();
  }

  // GET /api/v1/loyalty/balance
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        return;
      }

      let account = await prisma.loyaltyAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        // Create an empty account if they don't have one
        account = await prisma.loyaltyAccount.create({
          data: { userId, balance: 0 },
        });
      }

      res.status(200).json({ success: true, data: account });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST /api/v1/loyalty/redeem
  async redeem(req: Request, res: Response): Promise<void> {
    try {
      const { points } = req.body;
      let { userId } = req.body;
      
      const authUserId = req.auth?.userId;
      const userRole = req.auth?.role;

      if (!authUserId) {
        res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        return;
      }

      // If POS seller is trying to redeem points for a specific client
      if (userRole === 'ADMIN' || userRole === 'SELLER' || userRole === 'SUPERADMIN') {
        if (!userId) {
           res.status(400).json({ success: false, error: 'Se requiere userId del cliente en POS' });
           return;
        }
      } else {
        // Standard E-commerce user
        userId = authUserId;
      }

      if (!points || isNaN(Number(points))) {
        res.status(400).json({ success: false, error: 'Se requiere cantidad de puntos válida' });
        return;
      }

      const result = await this.redeemLoyaltyPointsUseCase.execute({
        userId: Number(userId),
        pointsToRedeem: Number(points),
      });

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message.includes('insuficientes') || error.message.includes('mayor a 0')) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
