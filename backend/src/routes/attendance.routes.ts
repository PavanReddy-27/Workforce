import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { validateRequest } from '../middleware/validateRequest';
import { getAttendanceQuerySchema } from '../schemas/attendance.schema';

const router = Router();
const controller = new AttendanceController();

router.get(
  '/',
  validateRequest({ query: getAttendanceQuerySchema }),
  controller.getAttendance
);

export const attendanceRoutes = router;
