import { Router } from 'express';
import { SalesAnomalyController } from '@infrastructure/http/controllers/SalesAnomalyController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const ctrl = new SalesAnomalyController();

// T-287: Endpoints admin para anomalías de ventas
router.get('/admin/sales-anomalies', requirePermission('sales:read'), ctrl.getAnomalies);
router.patch('/admin/sales-anomalies/:id/resolve', requirePermission('sales:read'), ctrl.resolveAnomaly);

export default router;
