import { Router } from 'express';
import { DashboardKpiController } from '@infrastructure/http/controllers/DashboardKpiController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new DashboardKpiController();

router.get(
  '/admin/dashboard/kpis',
  requirePermission('sales:read'),
  controller.getKpis.bind(controller)
);

export default router;
