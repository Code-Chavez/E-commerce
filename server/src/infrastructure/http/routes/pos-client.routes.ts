import { Router } from 'express';
import { PosClientController } from '@infrastructure/http/controllers/PosClientController';
import { requireAuth } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new PosClientController();

// POST /api/v1/pos/clients/quick-register — Registro rápido de cliente desde el POS (HU-007)
router.post(
  '/pos/clients/quick-register',
  requireAuth,
  controller.quickRegister.bind(controller)
);

// GET /api/v1/pos/clients/lookup — Consulta predictiva de DNI/RUC en Factiliza (HU-007)
router.get(
  '/pos/clients/lookup',
  requireAuth,
  controller.lookup.bind(controller)
);

// GET /api/v1/pos/clients/search — Búsqueda express de cliente con paginación (HU-033)
router.get(
  '/pos/clients/search',
  requireAuth,
  controller.search.bind(controller)
);

export default router;

router.get(
  '/pos-clients/:id/loyalty',
  requireAuth,
  controller.getLoyaltyBalance.bind(controller)
);

