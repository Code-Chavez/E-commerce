import { Router } from 'express';
import { StockTransferController } from '@infrastructure/http/controllers/StockTransferController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new StockTransferController();

// POST /api/v1/stock-transfers — Registrar transferencia interna entre sedes (HU-024)
router.post(
  '/stock-transfers',
  requirePermission('inventory:write'),
  controller.create.bind(controller)
);

// GET /api/v1/stock-transfers/:id/guide — Generar guía PDF (HU-024)
router.get(
  '/stock-transfers/:id/guide',
  requirePermission('inventory:read'),
  controller.getGuide.bind(controller)
);

export default router;
