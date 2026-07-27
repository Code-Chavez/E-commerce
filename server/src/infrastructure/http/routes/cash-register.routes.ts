import { Router } from 'express';
import { CashRegisterController } from '@infrastructure/http/controllers/CashRegisterController';
import { requireAuth } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new CashRegisterController();

// POST /api/v1/cash-registers — Crear caja registradora (Solo ADMIN)
router.post(
  '/cash-registers',
  requireAuth,
  controller.create.bind(controller)
);

// GET /api/v1/cash-registers — Listar todas las cajas registradoras o filtrar por branchId (ADMIN o SELLER)
router.get(
  '/cash-registers',
  requireAuth,
  controller.findAll.bind(controller)
);

// PATCH /api/v1/cash-registers/:id — Editar caja registradora (Solo ADMIN)
router.patch(
  '/cash-registers/:id',
  requireAuth,
  controller.update.bind(controller)
);

// DELETE /api/v1/cash-registers/:id — Eliminar lógicamente una caja registradora (Solo ADMIN)
router.delete(
  '/cash-registers/:id',
  requireAuth,
  controller.delete.bind(controller)
);

export default router;
