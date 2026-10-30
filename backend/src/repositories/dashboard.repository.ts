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
   * - Total Employees: Active employees matching optional dept/location
   * - Present Today: Active employees with Present status on effective date
   * - Absent Today: Active employees with Absent status on effective date
   * - On Leave: Active employees with On Leave status on effective date
   * - Attendance Rate: Present / (Recorded Active Employees) * 100
   */
  public getSummaryKpis(options: DashboardFilterCriteria): DashboardSummaryKpis {
    const effectiveDate = this.getEffectiveDate(options.date);

    const empWhereClauses: string[] = ["e.employment_status = 'Active'"];
    const empParams: (string | number)[] = [];

    if (options.department && options.department !== 'All Departments') {
      const deptNum = Number(options.department);
      if (!isNaN(deptNum)) {
        empWhereClauses.push('e.department_id = ?');
        empParams.push(deptNum);
      } else {
        empWhereClauses.push('LOWER(d.name) = LOWER(?)');
        empParams.push(options.department);
      }
    }

    if (options.location && options.location !== 'All Locations') {
      empWhereClauses.push('e.location = ?');
      empParams.push(options.location);
    }

    const empWhereSql = empWhereClauses.join(' AND ');

    // 1. Total Active Employees
    const totalEmpSql = `
      SELECT COUNT(*) as count
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${empWhereSql}
    `;
    const totalEmployees = (
      this.db.prepare(totalEmpSql).get(...empParams) as { count: number }
    ).count;

    // 2. Attendance Counts for Active Employees on Effective Date
    const attendanceSql = `
      SELECT 
        a.status,
        COUNT(*) as count
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE a.attendance_date = ? AND ${empWhereSql}
      GROUP BY a.status
    `;

    const statusRows = this.db.prepare(attendanceSql).all(effectiveDate, ...empParams) as {
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
  }): AttendanceTrendItem[] {
    const whereClauses: string[] = [
      'a.attendance_date BETWEEN ? AND ?',
      "e.employment_status = 'Active'",
    ];
    const params: (string | number)[] = [options.startDate, options.endDate];

    if (options.department && options.department !== 'All Departments') {
      const deptNum = Number(options.department);
      if (!isNaN(deptNum)) {
        whereClauses.push('e.department_id = ?');
        params.push(deptNum);
      } else {
        whereClauses.push('LOWER(d.name) = LOWER(?)');
        params.push(options.department);
      }
    }

    if (options.location && options.location !== 'All Locations') {
      whereClauses.push('e.location = ?');
      params.push(options.location);
    }

    const sql = `
      SELECT
        a.attendance_date as date,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'Present' AND e.location != 'Remote Global' THEN 1 ELSE 0 END) as inOffice,
        SUM(CASE WHEN a.status = 'Present' AND e.location = 'Remote Global' THEN 1 ELSE 0 END) as remote,
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
      inOffice: number;
      remote: number;
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
        inOffice: r.inOffice,
        remote: r.remote,
        absent: r.absent,
        onLeave: r.onLeave,
        totalRecorded: recorded,
        attendanceRate: rate,
      };
    });
  }

  /**
   * Real SQL aggregation for workforce distribution
   */
  public getWorkforceDistribution(): WorkforceDistribution {
    // Total employees excluding Terminated
    const totalStmt = this.db.prepare(
      "SELECT COUNT(*) as count FROM employees WHERE employment_status != 'Terminated'"
    );
    const totalEmployees = (totalStmt.get() as { count: number }).count;

    // By Department
    const deptSql = `
      SELECT
        d.id as departmentId,
        d.name as departmentName,
        COUNT(e.id) as headcount
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.employment_status != 'Terminated'
      GROUP BY d.id
      ORDER BY headcount DESC
    `;
    const deptRows = this.db.prepare(deptSql).all() as {
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
        employment_status as status,
        COUNT(*) as count
      FROM employees
      GROUP BY employment_status
      ORDER BY count DESC
    `;
    const statusRows = this.db.prepare(statusSql).all() as {
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
