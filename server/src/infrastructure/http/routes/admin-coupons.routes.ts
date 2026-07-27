import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AdminCouponController } from '../controllers/admin/AdminCouponController';
import { CreateBatchCouponsUseCase } from '@application/use-cases/admin/CreateBatchCouponsUseCase';
import { GetAdminCouponsUseCase } from '@application/use-cases/admin/GetAdminCouponsUseCase';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

const createBatchCouponsUseCase = new CreateBatchCouponsUseCase(prisma);
const getAdminCouponsUseCase = new GetAdminCouponsUseCase(prisma);

const adminCouponController = new AdminCouponController(
  createBatchCouponsUseCase,
  getAdminCouponsUseCase
);

const checkAdmin = (req: any, res: any, next: any) => {
  const roleName = req.auth?.role?.name || req.auth?.role;
  if (roleName === 'ADMIN' || roleName === 'Admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'No autorizado. Solo ADMIN.' });
};

router.use(requireAuth);
router.use(checkAdmin);

router.post('/', adminCouponController.createBatch.bind(adminCouponController));
router.get('/', adminCouponController.getAll.bind(adminCouponController));

export default router;
