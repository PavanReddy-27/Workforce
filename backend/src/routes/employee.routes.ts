import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  getEmployeesQuerySchema,
  getEmployeeByIdParamsSchema,
  createEmployeeBodySchema,
  updateEmployeeBodySchema,
} from '../schemas/employee.schema';

const router = Router();
const controller = new EmployeeController();

router.get('/locations', controller.getLocations);

router.get(
  '/',
  validateRequest({ query: getEmployeesQuerySchema }),
  controller.getEmployees
);

router.post(
  '/',
  validateRequest({ body: createEmployeeBodySchema }),
  controller.createEmployee
);

router.get(
  '/export',
  controller.exportEmployees
);

router.get(
  '/:id',
  validateRequest({ params: getEmployeeByIdParamsSchema }),
  controller.getEmployeeById
);

router.put(
  '/:id',
  validateRequest({ params: getEmployeeByIdParamsSchema, body: updateEmployeeBodySchema }),
  controller.updateEmployee
);

router.delete(
  '/:id',
  validateRequest({ params: getEmployeeByIdParamsSchema }),
  controller.deleteEmployee
);

export const employeeRoutes = router;
