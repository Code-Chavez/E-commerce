import { Router } from 'express';
import multer from 'multer';
import { LogisticsController } from '../controllers/LogisticsController';
import { requireAuth } from '../middlewares/auth.middleware';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
const controller = new LogisticsController();

const checkSupplyOrAdmin = (req: any, res: any, next: any) => {
  const roleName = req.auth?.role?.name || req.auth?.role;
  const isAuthorized =
    roleName === 'ADMIN' ||
    roleName === 'Admin' ||
    roleName === 'SUPPLY' ||
    roleName === 'Abastecimiento' ||
    roleName === 'Abastecedor';

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado: Se requiere el rol de Admin o Abastecimiento',
    });
  }
  next();
};

router.get('/logistics/orders/pending', requireAuth, checkSupplyOrAdmin, controller.getPendingOrders);
router.post('/logistics/picking', requireAuth, checkSupplyOrAdmin, controller.picking);
router.get('/logistics/deliveries/by-zone', requireAuth, checkSupplyOrAdmin, controller.getPendingDeliveriesByZone);
router.get('/logistics/deliveries', requireAuth, checkSupplyOrAdmin, controller.getDeliveries);
router.get('/logistics/delivery-men', requireAuth, checkSupplyOrAdmin, controller.getDeliveryMen);
router.post('/logistics/deliveries/:id/assign', requireAuth, checkSupplyOrAdmin, controller.assign);
router.get('/logistics/deliveries/:id/label', requireAuth, checkSupplyOrAdmin, controller.getLabel);
router.patch('/logistics/deliveries/:id/status', requireAuth, checkSupplyOrAdmin, controller.updateStatus);
router.post('/logistics/deliveries/:id/failed-attempt', requireAuth, checkSupplyOrAdmin, controller.registerFailedAttempt);
router.patch('/logistics/deliveries/:id/confirm', requireAuth, checkSupplyOrAdmin, upload.single('photo'), controller.confirmDelivery);
router.patch('/logistics/deliveries/:id/return', requireAuth, checkSupplyOrAdmin, controller.returnDelivery);
router.post('/logistics/deliveries/:id/confirm-pin', requireAuth, checkSupplyOrAdmin, controller.confirmDeliveryPin);

export default router;
