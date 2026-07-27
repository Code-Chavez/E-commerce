import { Router } from 'express';
import { InventoryAuditController } from '@infrastructure/http/controllers/InventoryAuditController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const controller = new InventoryAuditController();

// POST /api/v1/inventory-audits — Registrar auditoría de inventario físico (HU-029)
router.post(
  '/inventory-audits',
  requirePermission('inventory:write'),
  controller.create.bind(controller)
);

export default router;
