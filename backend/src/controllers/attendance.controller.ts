import type { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { sendError, sendSuccess } from '../utils/response';
import type { GetAttendanceQuery } from '../schemas/attendance.schema';
import { getUserDataScope } from '../middleware/auth.middleware';

export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService = new AttendanceService()) {}

  public getAttendance = (req: Request, res: Response): void => {
    const query = req.query as unknown as GetAttendanceQuery;
    const scope = req.user ? getUserDataScope(req.user) : null;
    if (!scope) {
      sendError(res, 403, 'FORBIDDEN', 'Your account must be linked to an employee record to access attendance data.');
      return;
    }
    const result = this.attendanceService.getAttendance({
      ...query,
      ...(scope.employeeId !== undefined ? { employeeId: scope.employeeId } : {}),
      ...(scope.departmentId !== undefined ? { department: String(scope.departmentId) } : {}),
    });

    sendSuccess(res, result.data, 200, {
      pagination: result.pagination,
      summary: result.summary,
    });
  };

  public clockIn = (req: Request, res: Response): void => {
    const employeeId = req.user?.employee_id;
    if (!employeeId) {
      sendError(res, 403, 'FORBIDDEN', 'Your account must be linked to an employee record to clock in.');
      return;
    }

    const timestamp = new Date().toISOString();
    const record = this.attendanceService.clockIn(employeeId, timestamp.slice(0, 10), timestamp);
    if (!record) {
      sendError(res, 409, 'ATTENDANCE_CONFLICT', 'You have already clocked in today or are marked as on leave.');
      return;
    }

    sendSuccess(res, record, 201);
  };

  public clockOut = (req: Request, res: Response): void => {
    const employeeId = req.user?.employee_id;
    if (!employeeId) {
      sendError(res, 403, 'FORBIDDEN', 'Your account must be linked to an employee record to clock out.');
      return;
    }

    const timestamp = new Date().toISOString();
    const date = timestamp.slice(0, 10);
    const record = this.attendanceService.clockOut(employeeId, date, timestamp);
    if (!record) {
      const existing = this.attendanceService.getAttendance({ employeeId, date, page: 1, limit: 1 });
      const message = existing.data[0]?.check_out_time
        ? 'You have already clocked out today.'
        : 'Clock in before clocking out.';
      sendError(res, 409, 'ATTENDANCE_CONFLICT', message);
      return;
    }

    sendSuccess(res, record);
  };
}
