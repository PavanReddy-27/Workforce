import type { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { sendSuccess } from '../utils/response';
import type { GetAttendanceQuery } from '../schemas/attendance.schema';

export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService = new AttendanceService()) {}

  public getAttendance = (req: Request, res: Response): void => {
    const query = req.query as unknown as GetAttendanceQuery;
    const result = this.attendanceService.getAttendance(query);

    sendSuccess(res, result.data, 200, {
      pagination: result.pagination,
    });
  };
}
