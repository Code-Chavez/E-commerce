import { Router } from 'express';
import { PosStockController } from '@infrastructure/http/controllers/PosStockController';
import { requireAuth } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new PosStockController();

// GET /api/v1/pos/stock/cross-branch — Consultar stock entre sucursales para el POS (HU-023)
router.get(
  '/pos/stock/cross-branch',
  requireAuth,
  controller.getCrossBranchStock.bind(controller)
);

export default router;
