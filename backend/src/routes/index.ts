import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { departmentRoutes } from './department.routes';
import { employeeRoutes } from './employee.routes';
import { attendanceRoutes } from './attendance.routes';
import { dashboardRoutes } from './dashboard.routes';
import { authRoutes } from './auth.routes';
import { authenticate } from '../middleware/auth.middleware';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply global API rate limiter
router.use(apiRateLimiter);

// Public health check and authentication routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Protected core business routes (require valid JWT access token)
router.use('/departments', authenticate, departmentRoutes);
router.use('/employees', authenticate, employeeRoutes);
router.use('/attendance', authenticate, attendanceRoutes);
router.use('/dashboard', authenticate, dashboardRoutes);

export const apiRoutes = router;
