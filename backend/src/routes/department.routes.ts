import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();
const controller = new DepartmentController();

router.get('/', requirePermission('departments:read'), controller.getDepartments);

export const departmentRoutes = router;
