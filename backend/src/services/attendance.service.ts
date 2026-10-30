import { AttendanceRepository } from '../repositories/attendance.repository';
import type {
  AttendanceWithEmployee,
  AttendanceFilterOptions,
  PaginatedResult,
} from '../types';

export class AttendanceService {
  constructor(private readonly attendanceRepo: AttendanceRepository = new AttendanceRepository()) {}

  public getAttendance(options: AttendanceFilterOptions): PaginatedResult<AttendanceWithEmployee> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));

    if (options.startDate && options.endDate && options.startDate > options.endDate) {
      throw new Error('startDate cannot be after endDate');
    }

    const { records, total } = this.attendanceRepo.findAll({
      ...options,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: records,
      pagination: {
        page,
        limit,
        totalRecords: total,
        totalPages,
      },
    };
  }
}
