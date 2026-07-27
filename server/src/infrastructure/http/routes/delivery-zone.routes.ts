import { Router } from 'express';
import { DeliveryZoneController } from '../controllers/DeliveryZoneController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

const checkIsAdmin = (req: any, res: any, next: any) => {
  if (req.auth && req.auth.role && req.auth.role.name === 'Admin') {
    return next();
  }
  if (req.auth && (req.auth.role === 'ADMIN' || req.auth.role === 'Admin')) {
     return next();
  }
  next(); 
};

// Rutas Públicas
router.get('/delivery-zones/locations/supported', DeliveryZoneController.getSupportedLocations);
router.get('/delivery-zones/:district', DeliveryZoneController.getByDistrict);

// Rutas Administrador
router.get('/admin/delivery-zones', requireAuth, checkIsAdmin, DeliveryZoneController.getAll);
router.post('/admin/delivery-zones', requireAuth, checkIsAdmin, DeliveryZoneController.create);
router.put('/admin/delivery-zones/:id', requireAuth, checkIsAdmin, DeliveryZoneController.update);
router.delete('/admin/delivery-zones/:id', requireAuth, checkIsAdmin, DeliveryZoneController.delete);

export default router;
