import { Router } from 'express';
import { LoyaltyController } from '../controllers/LoyaltyController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const loyaltyController = new LoyaltyController();

router.get('/balance', requireAuth, loyaltyController.getBalance.bind(loyaltyController));
router.post('/redeem', requireAuth, loyaltyController.redeem.bind(loyaltyController));

export default router;
