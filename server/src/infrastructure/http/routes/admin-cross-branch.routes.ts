import { Router } from 'express';
import { CrossBranchMonitorController } from '@infrastructure/http/controllers/CrossBranchMonitorController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new CrossBranchMonitorController();

// GET /api/v1/admin/cross-branch/pending - Monitoreo de ventas Cross-Branch pendientes (HU-057 T-150)
router.get(
  '/admin/cross-branch/pending',
  requirePermission('inventory:read'),
  controller.getPendingSales.bind(controller)
);

export default router;
