import { Router } from 'express';
import { UserController } from '@infrastructure/http/controllers/UserController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

/**
 * HU-009 / T-050: Toggle user active status.
 * Only principals with 'users:write' permission (Administrador) may call this.
 */
router.patch(
  '/users/:id/status',
  requirePermission('users:write'),
  userController.updateStatus.bind(userController),
);

export default router;
