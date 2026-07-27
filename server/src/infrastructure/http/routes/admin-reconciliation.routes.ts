import { Router } from 'express';
import { AdminReconciliationController } from '../controllers/AdminReconciliationController';
import { requirePermission } from '../middlewares/auth.middleware';

const router = Router();
const controller = new AdminReconciliationController();

router.post(
  '/admin/reconcile/stripe',
  requirePermission('roles:manage'),
  controller.reconcileStripe.bind(controller)
);

export default router;
