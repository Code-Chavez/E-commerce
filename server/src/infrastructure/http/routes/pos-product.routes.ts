import { Router } from 'express';
import { PosProductController } from '@infrastructure/http/controllers/PosProductController';
import { requireAuth } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new PosProductController();

// GET /api/v1/pos/products?sku=... — Buscar variante por SKU o nombre de producto en el POS (HU-031)
router.get(
  '/pos/products',
  requireAuth,
  controller.search.bind(controller)
);

export default router;
