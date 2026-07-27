import { Router } from 'express';
import { AdminBackupConfigController } from '../controllers/admin/AdminBackupConfigController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const controller = new AdminBackupConfigController();

router.get('/', requireAuth, controller.getConfig.bind(controller));
router.put('/', requireAuth, controller.updateConfig.bind(controller));
router.post('/notify-failure', controller.notifyFailure.bind(controller));

export default router;
