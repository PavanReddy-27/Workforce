import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { departmentRoutes } from './department.routes';
import { employeeRoutes } from './employee.routes';
import { attendanceRoutes } from './attendance.routes';
import { dashboardRoutes } from './dashboard.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/departments', departmentRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/dashboard', dashboardRoutes);

export const apiRoutes = router;
