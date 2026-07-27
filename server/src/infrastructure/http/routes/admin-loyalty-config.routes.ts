import { Router } from 'express';
import { AdminLoyaltyConfigController } from '../controllers/admin/AdminLoyaltyConfigController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const controller = new AdminLoyaltyConfigController();

router.use(requireAuth);

router.get('/', controller.getConfig.bind(controller));
router.put('/', controller.updateConfig.bind(controller));

export default router;
