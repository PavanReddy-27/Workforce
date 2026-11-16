import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { validateRequest } from '../middleware/validateRequest';
import { getAttendanceQuerySchema } from '../schemas/attendance.schema';
import { requireAnyPermission } from '../middleware/auth.middleware';

const router = Router();
const controller = new AttendanceController();

router.get(
  '/',
  requireAnyPermission('attendance:read_all', 'attendance:read_dept', 'attendance:read_own'),
  validateRequest({ query: getAttendanceQuerySchema }),
  controller.getAttendance
);

export const attendanceRoutes = router;
