import { Router } from 'express';
import { PrismaNewsletterRepository } from '@infrastructure/database/repositories/PrismaNewsletterRepository';
import { ExcelReportService } from '@infrastructure/services/ExcelReportService';
import { GetNewsletterSubscribersUseCase } from '@application/use-cases/GetNewsletterSubscribersUseCase';
import { ExportNewsletterSubscribersUseCase } from '@application/use-cases/ExportNewsletterSubscribersUseCase';
import { AdminNewsletterController } from '../controllers/AdminNewsletterController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

const repository = new PrismaNewsletterRepository();
const excelService = new ExcelReportService();

const getNewsletterSubscribersUseCase = new GetNewsletterSubscribersUseCase(
  repository
);
const exportNewsletterSubscribersUseCase =
  new ExportNewsletterSubscribersUseCase(repository, excelService);

const adminNewsletterController = new AdminNewsletterController(
  getNewsletterSubscribersUseCase,
  exportNewsletterSubscribersUseCase
);

const checkAdmin = (req: any, res: any, next: any) => {
  const roleName = req.auth?.role?.name || req.auth?.role;
  if (roleName === 'ADMIN' || roleName === 'Admin') {
    return next();
  }
  return res
    .status(403)
    .json({ success: false, message: 'No autorizado. Solo ADMIN.' });
};

router.use(requireAuth);
router.use(checkAdmin);

router.get(
  '/subscribers',
  adminNewsletterController.getAll.bind(adminNewsletterController)
);
router.get(
  '/subscribers/export',
  adminNewsletterController.export.bind(adminNewsletterController)
);

export default router;
