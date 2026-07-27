import { Router } from 'express';
import { KardexController } from '@infrastructure/http/controllers/KardexController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const ctrl = new KardexController();

router.get('/kardex', requirePermission('products:read'), ctrl.getMovements.bind(ctrl));

export default router;
