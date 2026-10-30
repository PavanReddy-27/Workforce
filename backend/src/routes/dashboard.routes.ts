import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  getDashboardSummaryQuerySchema,
  getDashboardAttendanceQuerySchema,
} from '../schemas/dashboard.schema';

const router = Router();
const controller = new DashboardController();

router.get(
  '/summary',
  validateRequest({ query: getDashboardSummaryQuerySchema }),
  controller.getSummary
);

router.get(
  '/attendance',
  validateRequest({ query: getDashboardAttendanceQuerySchema }),
  controller.getAttendance
);

router.get('/distribution', controller.getDistribution);

export const dashboardRoutes = router;
