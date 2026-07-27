import { Router } from 'express';
import { ComplaintController } from '@infrastructure/http/controllers/ComplaintController';
import { requireAuth } from '@infrastructure/http/middlewares/auth.middleware';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const complaintController = new ComplaintController();

// T-271: Endpoints cliente (requiere autenticación)
router.post('/complaints', requireAuth, complaintController.createComplaint);
router.get('/complaints/my', requireAuth, complaintController.getUserComplaints);

// T-271: Endpoints admin
router.get('/admin/complaints', requirePermission('users:read'), complaintController.getAdminComplaints);
router.patch('/admin/complaints/:id/status', requirePermission('users:write'), complaintController.updateStatus);

export default router;
