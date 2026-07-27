import { Router } from 'express';
import { OperatingExpenseController } from '@infrastructure/http/controllers/admin/OperatingExpenseController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new OperatingExpenseController();

router.post(
  '/admin/expenses',
  requirePermission('expenses:write'),
  controller.create.bind(controller)
);

router.get(
  '/admin/expenses',
  requirePermission('expenses:read'),
  controller.getAll.bind(controller)
);

router.put(
  '/admin/expenses/:id',
  requirePermission('expenses:write'),
  controller.update.bind(controller)
);

router.delete(
  '/admin/expenses/:id',
  requirePermission('expenses:write'),
  controller.delete.bind(controller)
);

export default router;
