import type Database from 'better-sqlite3';
import { getDb } from '../database/connection';
import type {
  AttendanceRecord,
  AttendanceWithEmployee,
  AttendanceFilterOptions,
} from '../types';

export class AttendanceRepository {
  private readonly db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDb();
  }

  public findAll(options: AttendanceFilterOptions): {
    records: AttendanceWithEmployee[];
    total: number;
  } {
    const {
      page = 1,
      limit = 50,
      employeeId,
      date,
      startDate,
      endDate,
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

    if (status) {
      whereClauses.push('a.status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as count
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      ${whereSql}
    `;
    const totalResult = this.db.prepare(countSql).get(...params) as { count: number };
    const total = totalResult.count;

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

    return { records, total };
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
