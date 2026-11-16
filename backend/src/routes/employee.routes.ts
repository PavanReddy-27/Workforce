import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { validateRequest } from '../middleware/validateRequest';
import { requireAnyPermission, requirePermission } from '../middleware/auth.middleware';
import {
  getEmployeesQuerySchema,
  getEmployeeByIdParamsSchema,
  createEmployeeBodySchema,
  updateEmployeeBodySchema,
} from '../schemas/employee.schema';

const router = Router();
const controller = new EmployeeController();

// Locations are scoped to the user's department or employee profile.
router.get('/locations', requirePermission('departments:read'), controller.getLocations);

router.get(
  '/export',
  requirePermission('export:data'),
  controller.exportEmployees
);

router.get(
  '/',
  requireAnyPermission('employees:read_all', 'employees:read_dept', 'employees:read_own'),
  validateRequest({ query: getEmployeesQuerySchema }),
  controller.getEmployees
);

router.post(
  '/',
  requirePermission('employees:create'),
  validateRequest({ body: createEmployeeBodySchema }),
  controller.createEmployee
);

router.get(
  '/:id',
  requireAnyPermission('employees:read_all', 'employees:read_dept', 'employees:read_own'),
  validateRequest({ params: getEmployeeByIdParamsSchema }),
  controller.getEmployeeById
);

router.put(
  '/:id',
  requirePermission('employees:update'),
  validateRequest({ params: getEmployeeByIdParamsSchema, body: updateEmployeeBodySchema }),
  controller.updateEmployee
);

router.delete(
  '/:id',
  requirePermission('employees:delete'),
  validateRequest({ params: getEmployeeByIdParamsSchema }),
  controller.deleteEmployee
);

export const employeeRoutes = router;
