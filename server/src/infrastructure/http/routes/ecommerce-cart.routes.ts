import { Router } from 'express';
import { CartController } from '../controllers/ecommerce/CartController';
import { optionalAuth } from '../middlewares/auth.middleware';

const router = Router();
const controller = new CartController();

router.get('/', optionalAuth, controller.getCart.bind(controller));
router.post('/items', optionalAuth, controller.addItem.bind(controller));
router.patch('/items/:id', optionalAuth, controller.updateItem.bind(controller));
router.delete('/items/:id', optionalAuth, controller.removeItem.bind(controller));
router.post('/merge', optionalAuth, controller.mergeCart.bind(controller));

export default router;
