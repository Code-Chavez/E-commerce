import { Router } from 'express';
import { InventorySettingsController } from '@infrastructure/http/controllers/InventorySettingsController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const ctrl = new InventorySettingsController();

router.get('/admin/inventory-settings', requirePermission('admin:read'), ctrl.getSettings.bind(ctrl));
router.put('/admin/inventory-settings', requirePermission('admin:write'), ctrl.updateSettings.bind(ctrl));

export default router;
