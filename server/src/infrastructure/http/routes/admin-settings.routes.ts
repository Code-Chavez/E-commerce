import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';

import { SystemSettingController } from '../controllers/admin/SystemSettingController';

const router = Router();
const controller = new SystemSettingController();

router.use(requireAuth);
// Añadir un middleware inline rápido para roles ADMIN:
router.use((req, res, next) => {
  if (req.auth?.role !== 'ADMIN' && req.auth?.role !== 'SUPERADMIN') {
    return res.status(403).json({ success: false, error: 'Acceso denegado' });
  }
  next();
});

router.get('/settings', controller.getAll);
router.put('/settings/:key', controller.update);

export { router as adminSettingsRoutes };
