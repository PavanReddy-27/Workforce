import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';

const router = Router();
const controller = new DepartmentController();

router.get('/', controller.getDepartments);

export const departmentRoutes = router;
