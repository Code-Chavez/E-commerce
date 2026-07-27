import { Router } from 'express';
import { EmployeeController } from '@infrastructure/http/controllers/EmployeeController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const employeeController = new EmployeeController();

router.get(
  '/employees',
  requirePermission('users:read'),
  employeeController.getEmployees.bind(employeeController)
);

router.post(
  '/employees',
  requirePermission('users:write'),
  employeeController.createEmployee.bind(employeeController)
);

router.put(
  '/employees/:id',
  requirePermission('users:write'),
  employeeController.updateEmployee.bind(employeeController)
);

router.patch(
  '/employees/:id/status',
  requirePermission('users:write'),
  employeeController.toggleStatus.bind(employeeController)
);

export default router;
