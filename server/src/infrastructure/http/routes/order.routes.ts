import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

import { AdminOrderController } from '../controllers/AdminOrderController';

const router = Router();
const orderController = new OrderController();
const adminOrderController = new AdminOrderController();

router.get('/orders', requireAuth, orderController.listMyOrders.bind(orderController));
router.get('/orders/:id/receipt/pdf', requireAuth, orderController.downloadReceiptPdf.bind(orderController));
// Acciones del cliente sobre pedidos con entrega fallida (verifican propiedad del pedido)
router.post('/orders/:orderId/redelivery', requireAuth, orderController.requestRedelivery.bind(orderController));
router.post('/orders/:orderId/return-from-failed', requireAuth, orderController.requestReturnFromFailed.bind(orderController));
router.get('/admin/orders', requirePermission('roles:manage'), adminOrderController.listOrders.bind(adminOrderController));
router.patch('/admin/orders/:id/status', requirePermission('roles:manage'), orderController.updateOrderStatus.bind(orderController));
router.patch('/admin/orders/:id/refund-status', requirePermission('admin:write'), adminOrderController.updateRefundStatus.bind(adminOrderController));

export default router;
