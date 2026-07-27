import { Router } from 'express';
import { ReceiptController } from '@infrastructure/http/controllers/ReceiptController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new ReceiptController();

// GET /api/v1/receipts - Listar comprobantes electrónicos (HU-055 T-152)
router.get(
  '/receipts',
  requirePermission('sales:read'),
  controller.getReceipts.bind(controller)
);

// GET /api/v1/receipts/:id/pdf - Descargar PDF de comprobante POS (HU-055 T-152)
router.get(
  '/receipts/:id/pdf',
  requirePermission('sales:read'),
  controller.getReceiptPdf.bind(controller)
);

export default router;
