import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  getEmployeesQuerySchema,
  getEmployeeByIdParamsSchema,
} from '../schemas/employee.schema';

const router = Router();
const controller = new EmployeeController();

router.get(
  '/',
  validateRequest({ query: getEmployeesQuerySchema }),
  controller.getEmployees
);

router.get(
  '/:id',
  validateRequest({ params: getEmployeeByIdParamsSchema }),
  controller.getEmployeeById
);

export const employeeRoutes = router;
