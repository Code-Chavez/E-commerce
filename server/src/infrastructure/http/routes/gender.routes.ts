import { Router } from 'express';
import { GenderController } from '@infrastructure/http/controllers/GenderController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new GenderController();

// Rutas Administrativas de Género (Público Objetivo)
router.get(
  '/genders',
  requirePermission('products:read'),
  controller.getAll.bind(controller)
);

router.post(
  '/genders',
  requirePermission('products:write'),
  controller.create.bind(controller)
);

router.put(
  '/genders/:id',
  requirePermission('products:write'),
  controller.update.bind(controller)
);

router.delete(
  '/genders/:id',
  requirePermission('products:write'),
  controller.deactivate.bind(controller)
);

export default router;
