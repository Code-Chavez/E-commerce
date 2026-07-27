import { Router } from 'express';
import { CashTurnController } from '@infrastructure/http/controllers/CashTurnController';
import { requireAuth } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new CashTurnController();

// POST /api/v1/cash-turns/open — Abrir turno de caja (HU-032)
router.post(
  '/cash-turns/open',
  requireAuth,
  controller.open.bind(controller)
);

// GET /api/v1/cash-turns/active — Obtener turno activo del usuario (HU-032)
router.get(
  '/cash-turns/active',
  requireAuth,
  controller.getActiveTurn.bind(controller)
);

// POST /api/v1/cash-turns/:id/movements — Registrar movimiento de caja (HU-037 / T-136)
router.post(
  '/cash-turns/:id/movements',
  requireAuth,
  controller.registerMovement.bind(controller)
);

// GET /api/v1/cash-turns/:id/movements — Listar movimientos de un turno (HU-037 / T-136)
router.get(
  '/cash-turns/:id/movements',
  requireAuth,
  controller.getMovements.bind(controller)
);

// POST /api/v1/cash-turns/:id/close — Cerrar turno de caja (HU-037 / T-137)
router.post(
  '/cash-turns/:id/close',
  requireAuth,
  controller.closeTurn.bind(controller)
);

export default router;


