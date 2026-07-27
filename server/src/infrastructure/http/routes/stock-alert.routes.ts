import { Router } from 'express';
import { StockAlertController } from '@infrastructure/http/controllers/StockAlertController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new StockAlertController();

// GET /api/v1/stock-alerts
router.get(
  '/',
  requirePermission('inventory:read'),
  controller.getActiveAlerts.bind(controller)
);

// PATCH /api/v1/stock-alerts/:id/dismiss
router.patch(
  '/:id/dismiss',
  requirePermission('inventory:write'),
  controller.dismissAlert.bind(controller)
);

export default router;
