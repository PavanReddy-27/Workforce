import type Database from 'better-sqlite3';
import { getDb } from '../database/connection';
import type {
  DashboardSummaryKpis,
  AttendanceTrendItem,
  DepartmentDistributionItem,
  StatusDistributionItem,
  WorkforceDistribution,
} from '../types';

export interface DashboardFilterCriteria {
  date?: string;
  department?: string; // ID or name
  location?: string;
  status?: string;
  search?: string;
}

function buildEmployeeFilters(
  options: DashboardFilterCriteria,
  defaultStatus?: string
): { clauses: string[]; params: (string | number)[] } {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (options.status || defaultStatus) {
    clauses.push('e.employment_status = ?');
    params.push(options.status ?? defaultStatus ?? '');
  }
  if (options.department && options.department !== 'All Departments') {
    const departmentId = Number(options.department);
    if (!isNaN(departmentId)) {
      clauses.push('e.department_id = ?');
      params.push(departmentId);
    } else {
      clauses.push('LOWER(d.name) = LOWER(?)');
      params.push(options.department);
    }
  }
  if (options.location && options.location !== 'All Locations') {
    clauses.push('e.location = ?');
    params.push(options.location);
  }
  if (options.search?.trim()) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    clauses.push(`(
      LOWER(e.first_name) LIKE ? OR
      LOWER(e.last_name) LIKE ? OR
      LOWER(e.employee_code) LIKE ? OR
      LOWER(e.email) LIKE ?
    )`);
    params.push(term, term, term, term);
  }

  return { clauses, params };
}

export class DashboardRepository {
  private readonly db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDb();
  }

  /**
   * Determine the effective date for KPIs:
   * Uses supplied date, or finds the most recent attendance date in DB, or falls back to today.
   */
  public getEffectiveDate(suppliedDate?: string): string {
    if (suppliedDate) return suppliedDate;

    const row = this.db
      .prepare('SELECT MAX(attendance_date) as max_date FROM attendance')
      .get() as { max_date: string | null };

    if (row && row.max_date) {
      return row.max_date;
    }

    return new Date().toISOString().split('T')[0];
  }

  /**
   * Five Primary KPIs calculation adhering strictly to business rules:
   * - Total Employees: All matching employee records unless a status is selected
   * - Present Today: Active employees with Present status on effective date
   * - Absent Today: Active employees with Absent status on effective date
   * - On Leave: Active employees with On Leave status on effective date
   * - Attendance Rate: Present / (Recorded Active Employees) * 100
   */
  public getSummaryKpis(options: DashboardFilterCriteria): DashboardSummaryKpis {
    const effectiveDate = this.getEffectiveDate(options.date);

    const employeeFilters = buildEmployeeFilters(options);
    const empWhereSql = employeeFilters.clauses.length
      ? employeeFilters.clauses.join(' AND ')
      : '1 = 1';

    // 1. Total employees matching the dashboard filters
    const totalEmpSql = `
      SELECT COUNT(*) as count
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${empWhereSql}
    `;
    const totalEmployees = (
      this.db.prepare(totalEmpSql).get(...employeeFilters.params) as { count: number }
    ).count;

    // Attendance remains scoped to Active employees unless a status filter is selected.
    const attendanceFilters = buildEmployeeFilters(options, 'Active');
    const attendanceWhereSql = attendanceFilters.clauses.join(' AND ');
    const attendanceSql = `
      SELECT 
        a.status,
        COUNT(*) as count
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE a.attendance_date = ? AND ${attendanceWhereSql}
      GROUP BY a.status
    `;

    const statusRows = this.db.prepare(attendanceSql).all(
      effectiveDate,
      ...attendanceFilters.params
    ) as {
      status: string;
      count: number;
    }[];

    let presentToday = 0;
    let absentToday = 0;
    let onLeave = 0;

    for (const row of statusRows) {
      if (row.status === 'Present') presentToday = row.count;
      else if (row.status === 'Absent') absentToday = row.count;
      else if (row.status === 'On Leave') onLeave = row.count;
    }

    // Attendance Rate = Present / Recorded * 100
    const totalRecorded = presentToday + absentToday + onLeave;
    const attendanceRate = totalRecorded > 0
      ? Number(((presentToday / totalRecorded) * 100).toFixed(1))
      : 0;

    return {
      totalEmployees,
      presentToday,
      absentToday,
      onLeave,
      attendanceRate,
      date: effectiveDate,
      filtersApplied: {
        department: options.department,
        location: options.location,
        status: options.status,
      },
    };
  }

  /**
   * Date-grouped attendance trends over a date range
   */
  public getAttendanceTrends(options: {
    startDate: string;
    endDate: string;
    department?: string;
    location?: string;
    status?: string;
    search?: string;
  }): AttendanceTrendItem[] {
    const employeeFilters = buildEmployeeFilters(options, 'Active');
    const whereClauses = ['a.attendance_date BETWEEN ? AND ?', ...employeeFilters.clauses];
    const params: (string | number)[] = [
      options.startDate,
      options.endDate,
      ...employeeFilters.params,
    ];

    const sql = `
      SELECT
        a.attendance_date as date,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.status = 'On Leave' THEN 1 ELSE 0 END) as onLeave,
        COUNT(*) as totalRecorded
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY a.attendance_date
      ORDER BY a.attendance_date ASC
    `;

    const rows = this.db.prepare(sql).all(...params) as {
      date: string;
      present: number;
      absent: number;
      onLeave: number;
      totalRecorded: number;
    }[];

    return rows.map((r) => {
      const recorded = r.totalRecorded;
      const rate = recorded > 0 ? Number(((r.present / recorded) * 100).toFixed(1)) : 0;
      return {
        date: r.date,
        present: r.present,
        absent: r.absent,
        onLeave: r.onLeave,
        totalRecorded: recorded,
        attendanceRate: rate,
      };
    });
  }

  /**
   * Real SQL aggregation for the filtered employee population
   */
  public getWorkforceDistribution(options: DashboardFilterCriteria = {}): WorkforceDistribution {
    const employeeFilters = buildEmployeeFilters(options);
    const filteredWhereSql = employeeFilters.clauses.length
      ? employeeFilters.clauses.join(' AND ')
      : '1 = 1';
    const totalStmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${filteredWhereSql}
    `);
    const totalEmployees = (totalStmt.get(...employeeFilters.params) as { count: number }).count;

    // By Department
    const scopedDeptSql = `
      SELECT
        d.id as departmentId,
        d.name as departmentName,
        COUNT(e.id) as headcount
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      WHERE ${filteredWhereSql}
      GROUP BY d.id
      ORDER BY headcount DESC
    `;
    const deptRows = this.db.prepare(scopedDeptSql).all(...employeeFilters.params) as {
      departmentId: number;
      departmentName: string;
      headcount: number;
    }[];

    const byDepartment: DepartmentDistributionItem[] = deptRows.map((r) => ({
      departmentId: r.departmentId,
      departmentName: r.departmentName,
      headcount: r.headcount,
      percentage: totalEmployees > 0 ? Number(((r.headcount / totalEmployees) * 100).toFixed(1)) : 0,
    }));

    // By Status
    const statusSql = `
      SELECT
        e.employment_status as status,
        COUNT(*) as count
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${filteredWhereSql}
      GROUP BY e.employment_status
      ORDER BY count DESC
    `;
    const statusRows = this.db.prepare(statusSql).all(...employeeFilters.params) as {
      status: string;
      count: number;
    }[];

    const totalAllStatuses = statusRows.reduce((acc, r) => acc + r.count, 0);
    const byStatus: StatusDistributionItem[] = statusRows.map((r) => ({
      status: r.status,
      count: r.count,
      percentage: totalAllStatuses > 0 ? Number(((r.count / totalAllStatuses) * 100).toFixed(1)) : 0,
    }));

    return {
      byDepartment,
      byStatus,
      totalEmployees,
    };
  }
}
