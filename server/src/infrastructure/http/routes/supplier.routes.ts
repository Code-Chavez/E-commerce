// ─── HU-051 T-090: Rutas REST de Proveedores ─────────────────────────────────

import { Router } from 'express';
import { SupplierController } from '@infrastructure/http/controllers/SupplierController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const supplierController = new SupplierController();

// GET /api/v1/suppliers — Listar proveedores
router.get(
  '/suppliers',
  requirePermission('inventory:read'),
  supplierController.getAll.bind(supplierController)
);

// POST /api/v1/suppliers — Registrar proveedor
router.post(
  '/suppliers',
  requirePermission('inventory:write'),
  supplierController.create.bind(supplierController)
);

// PUT /api/v1/suppliers/:id — Actualizar proveedor
router.put(
  '/suppliers/:id',
  requirePermission('inventory:write'),
  supplierController.update.bind(supplierController)
);

// PATCH /api/v1/suppliers/:id/status — Activar / inactivar proveedor
router.patch(
  '/suppliers/:id/status',
  requirePermission('inventory:write'),
  supplierController.toggleStatus.bind(supplierController)
);

export default router;
