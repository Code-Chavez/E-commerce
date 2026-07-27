import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaCouponRepository } from '../../database/repositories/PrismaCouponRepository';
import { ValidateCouponUseCase } from '../../../application/use-cases/coupon/ValidateCouponUseCase';
import { CouponController } from '../controllers/CouponController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

const couponRepository = new PrismaCouponRepository(prisma);

// Use Cases
const validateCouponUseCase = new ValidateCouponUseCase(couponRepository);

// Controller
const couponController = new CouponController(validateCouponUseCase);

// Routes
// Note: Validation could be public or requireAuth depending on whether guests can checkout.
// Using requireAuth to match current store policies (users must be logged in to checkout).
router.post('/validate', requireAuth, couponController.validate);

export default router;
