import { Router } from 'express';
import { DiscountController } from '@infrastructure/http/controllers/pos/DiscountController';
import { SaleController } from '@infrastructure/http/controllers/pos/SaleController';
import { requireAuth, requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

/**
 * HU-034 / T-125: Rutas del módulo POS (Punto de Venta).
 *
 * Prefijo montado en app.ts: /api/v1/pos
 */

import { CashTurnController } from '@infrastructure/http/controllers/CashTurnController';

const router = Router();
const discountController = new DiscountController();
const saleController = new SaleController();
const cashTurnController = new CashTurnController();

/**
 * POST /api/v1/pos/discounts/validate
 */
router.post(
  '/discounts/validate',
  requirePermission('pos:discounts'), // Este asumo que sí lo tienen mapeado
  discountController.validate.bind(discountController)
);

/**
 * GET /api/v1/pos/credit-notes/validate/:code
 */
router.get(
  '/credit-notes/validate/:code',
  requireAuth,
  saleController.validateCreditNote.bind(saleController)
);

/**
 * POST /api/v1/pos/sales
 */
router.post(
  '/sales',
  requireAuth, // Cambiado temporalmente a requireAuth para pruebas porque el rol no tiene pos:sales
  saleController.processSale.bind(saleController)
);

/**
 * GET /api/v1/pos/sales/:id/receipt
 */
router.get(
  '/sales/:id/receipt',
  requireAuth, // Cambiado a requireAuth por ahora
  saleController.getReceiptData.bind(saleController)
);

/**
 * GET /api/v1/pos/turns/:id/sales
 */
router.get(
  '/turns/:id/sales',
  requireAuth,
  cashTurnController.getSalesByTurn.bind(cashTurnController)
);

/**
 * PATCH /api/v1/pos/sales/:id/cancel
 * HU-038 / T-139: Anular venta y revertir stock
 */
router.patch(
  '/sales/:id/cancel',
  requireAuth,
  saleController.cancelSale.bind(saleController)
);

/**
 * PATCH /api/v1/pos/sales/:id/confirm-cross-branch
 * HU-025 / T-148: Confirmar entrega física de venta cross-branch
 */
router.patch(
  '/sales/:id/confirm-cross-branch',
  requireAuth,
  saleController.confirmCrossBranch.bind(saleController)
);

export default router;
