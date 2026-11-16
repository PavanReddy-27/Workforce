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
}
