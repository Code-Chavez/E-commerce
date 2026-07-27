import { Router } from 'express';
import { RoleController } from '@infrastructure/http/controllers/RoleController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const roleController = new RoleController();

// GLOBAL RBAC PROTECTION: Enforce universal administrative access requirement (roles:manage) across routing table
const secureRbac = requirePermission('roles:manage');

/**
 * T-040: Creación de Roles
 * Permite dar de alta nuevas identidades autoritativas en el catálogo del sistema.
 */
router.post('/roles', secureRbac, roleController.createRole);

/**
 * T-040: Asignación de Roles a Usuarios
 * Vincula un usuario con un rol específico por medio de su identificador único.
 */
router.put('/users/:id/role', secureRbac, roleController.assignRoleToUser);

/**
 * T-053 helper: List roles for selector
 */
router.get('/roles', requirePermission('users:read'), roleController.getRoles.bind(roleController));

export default router;
