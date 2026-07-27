import { Router } from 'express';
import { AttributeController } from '@infrastructure/http/controllers/AttributeController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const ctrl = new AttributeController();

router.get('/attributes', requirePermission('products:read'), ctrl.getAll.bind(ctrl));
router.get('/attributes/:id', requirePermission('products:read'), ctrl.getOne.bind(ctrl));
router.post('/attributes', requirePermission('products:write'), ctrl.create.bind(ctrl));
router.patch('/attributes/:id', requirePermission('products:write'), ctrl.update.bind(ctrl));
router.delete('/attributes/:id', requirePermission('products:write'), ctrl.deactivate.bind(ctrl));

router.post('/attributes/:id/values', requirePermission('products:write'), ctrl.addValue.bind(ctrl));
router.delete('/attributes/:id/values/:valueId', requirePermission('products:write'), ctrl.deactivateValue.bind(ctrl));

export default router;
