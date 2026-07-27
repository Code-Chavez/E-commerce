import { Router } from 'express';
import { StockAdjustmentController } from '@infrastructure/http/controllers/StockAdjustmentController';
import { StockEntryController } from '@infrastructure/http/controllers/StockEntryController'; // HU-051 T-091
import { StockController } from '@infrastructure/http/controllers/StockController'; // HU-021 T-097
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const adjustmentCtrl = new StockAdjustmentController();
const stockEntryCtrl = new StockEntryController(); // HU-051 T-091
const stockCtrl = new StockController(); // HU-021 T-097

// GET /api/v1/stock — Consultar stock global y por sucursal (HU-021 T-097)
router.get('/stock', requirePermission('inventory:read'), stockCtrl.getStock.bind(stockCtrl));

// POST /api/v1/stock/adjustments — Ajuste manual de stock (HU-028)
router.post('/stock/adjustments', requirePermission('products:write'), adjustmentCtrl.create.bind(adjustmentCtrl));

// POST /api/v1/stock/entries — Registro de ingreso de mercadería (HU-051 T-091)
router.post('/stock/entries', requirePermission('inventory:write'), stockEntryCtrl.create.bind(stockEntryCtrl));

export default router;
