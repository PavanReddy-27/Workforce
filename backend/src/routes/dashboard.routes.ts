import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  getDashboardSummaryQuerySchema,
  getDashboardAttendanceQuerySchema,
  getDashboardDistributionQuerySchema,
} from '../schemas/dashboard.schema';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();
const controller = new DashboardController();

router.get(
  '/summary',
  requirePermission('dashboard:view'),
  validateRequest({ query: getDashboardSummaryQuerySchema }),
  controller.getSummary
);

router.get(
  '/attendance',
  requirePermission('dashboard:view'),
  validateRequest({ query: getDashboardAttendanceQuerySchema }),
  controller.getAttendance
);

router.get(
  '/distribution',
  requirePermission('dashboard:view'),
  validateRequest({ query: getDashboardDistributionQuerySchema }),
  controller.getDistribution
);

export const dashboardRoutes = router;
