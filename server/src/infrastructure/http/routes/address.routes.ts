import { Router } from 'express';
import { AddressController } from '@infrastructure/http/controllers/AddressController';
import { requireAuth } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const addressController = new AddressController();

router.get(
  '/addresses',
  requireAuth,
  addressController.list.bind(addressController)
);

router.post(
  '/addresses',
  requireAuth,
  addressController.create.bind(addressController)
);

router.put(
  '/addresses/:id',
  requireAuth,
  addressController.update.bind(addressController)
);

router.delete(
  '/addresses/:id',
  requireAuth,
  addressController.delete.bind(addressController)
);

export default router;
