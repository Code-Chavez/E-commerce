import { Router } from 'express';
import { BranchController } from '@infrastructure/http/controllers/BranchController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const branchController = new BranchController();

// Listar sucursales (mantenemos público para Catálogo/Footer)
router.get(
  '/branches',
  branchController.getBranches.bind(branchController)
);

// Crear sucursal (requiere users:write)
router.post(
  '/branches',
  requirePermission('users:write'),
  branchController.createBranch.bind(branchController)
);

// Editar sucursal (requiere users:write)
router.put(
  '/branches/:id',
  requirePermission('users:write'),
  branchController.updateBranch.bind(branchController)
);

// Inactivar/activar sucursal (requiere users:write)
router.patch(
  '/branches/:id/status',
  requirePermission('users:write'),
  branchController.toggleStatus.bind(branchController)
);

export default router;
