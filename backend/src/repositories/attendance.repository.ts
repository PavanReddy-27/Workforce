import type Database from 'better-sqlite3';
import { getDb } from '../database/connection';
import type {
  AttendanceRecord,
  AttendanceWithEmployee,
  AttendanceFilterOptions,
  AttendanceSummary,
} from '../types';

export class AttendanceRepository {
  private readonly db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDb();
  }

  public findAll(options: AttendanceFilterOptions): {
    records: AttendanceWithEmployee[];
    total: number;
    summary: AttendanceSummary;
  } {
    const {
      page = 1,
      limit = 50,
      employeeId,
      date,
      startDate,
      endDate,
      department,
      location,
      employeeStatus,
      search,
      status,
      sortBy = 'attendance_date',
      sortOrder = 'desc',
    } = options;

    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    if (employeeId !== undefined) {
      whereClauses.push('a.employee_id = ?');
      params.push(employeeId);
    }

    if (date) {
      whereClauses.push('a.attendance_date = ?');
      params.push(date);
    } else {
      if (startDate && endDate) {
        whereClauses.push('a.attendance_date BETWEEN ? AND ?');
        params.push(startDate, endDate);
      } else if (startDate) {
        whereClauses.push('a.attendance_date >= ?');
        params.push(startDate);
      } else if (endDate) {
        whereClauses.push('a.attendance_date <= ?');
        params.push(endDate);
      }
    }

    if (department && department !== 'All Departments') {
      const deptNum = Number(department);
      if (!isNaN(deptNum)) {
        whereClauses.push('e.department_id = ?');
        params.push(deptNum);
      } else {
        whereClauses.push('LOWER(d.name) = LOWER(?)');
        params.push(department);
      }
    }

    if (location && location !== 'All Locations') {
      whereClauses.push('e.location = ?');
      params.push(location);
    }

    if (employeeStatus) {
      whereClauses.push('e.employment_status = ?');
      params.push(employeeStatus);
    }

    if (search?.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      whereClauses.push(`(
        LOWER(e.first_name) LIKE ? OR
        LOWER(e.last_name) LIKE ? OR
        LOWER(e.employee_code) LIKE ? OR
        LOWER(e.email) LIKE ?
      )`);
      params.push(term, term, term, term);
    }

    if (status) {
      whereClauses.push('a.status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as count
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereSql}
    `;
    const totalResult = this.db.prepare(countSql).get(...params) as { count: number };
    const total = totalResult.count;

    const summarySql = `
      SELECT
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as presentCount,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absentCount,
        SUM(CASE WHEN a.status = 'On Leave' THEN 1 ELSE 0 END) as onLeaveCount,
        COUNT(*) as totalCount
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereSql}
    `;
    const summaryRow = this.db.prepare(summarySql).get(...params) as {
      presentCount: number | null;
      absentCount: number | null;
      onLeaveCount: number | null;
      totalCount: number;
    } | undefined;

    const present = summaryRow?.presentCount || 0;
    const absent = summaryRow?.absentCount || 0;
    const onLeave = summaryRow?.onLeaveCount || 0;
    const activeRecorded = present + absent;
    const rate = activeRecorded > 0 ? Number(((present / activeRecorded) * 100).toFixed(1)) : 0;

    const summary: AttendanceSummary = {
      present,
      absent,
      onLeave,
      total: summaryRow?.totalCount || 0,
      rate,
    };

    const allowedSortFields = new Set([
      'id',
      'employee_id',
      'attendance_date',
      'status',
      'check_in_time',
      'created_at',
    ]);
    const safeSortBy = allowedSortFields.has(sortBy) ? `a.${sortBy}` : 'a.attendance_date';
    const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const offset = Math.max(0, (page - 1) * limit);

    const querySql = `
      SELECT
        a.id,
        a.employee_id,
        a.attendance_date,
        a.status,
        a.check_in_time,
        a.check_out_time,
        a.created_at,
        a.updated_at,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email,
        e.department_id,
        d.name as department_name,
        e.location
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereSql}
      ORDER BY ${safeSortBy} ${safeSortOrder}, e.last_name ASC
      LIMIT ? OFFSET ?
    `;

    const records = this.db.prepare(querySql).all(...params, limit, offset) as AttendanceWithEmployee[];

    return { records, total, summary };
  }

  public findById(id: number): AttendanceWithEmployee | undefined {
    const sql = `
      SELECT
        a.id,
        a.employee_id,
        a.attendance_date,
        a.status,
        a.check_in_time,
        a.check_out_time,
        a.created_at,
        a.updated_at,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email,
        e.department_id,
        d.name as department_name,
        e.location
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE a.id = ?
    `;
    return this.db.prepare(sql).get(id) as AttendanceWithEmployee | undefined;
  }

  public findByEmployeeAndDate(employeeId: number, date: string): AttendanceRecord | undefined {
    const sql = `
      SELECT id, employee_id, attendance_date, status, check_in_time, check_out_time, created_at, updated_at
      FROM attendance
      WHERE employee_id = ? AND attendance_date = ?
    `;
    return this.db.prepare(sql).get(employeeId, date) as AttendanceRecord | undefined;
  }

  public count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as c FROM attendance');
    return (stmt.get() as { c: number }).c;
  }
}
