import type Database from 'better-sqlite3';
import { getDb } from '../database/connection';
import type { EmployeeWithDepartment, EmployeeFilterOptions } from '../types';

export const ALLOWED_EMPLOYEE_SORT_FIELDS = new Set([
  'id',
  'employee_code',
  'first_name',
  'last_name',
  'email',
  'department_id',
  'department_name',
  'location',
  'job_title',
  'employment_status',
  'hire_date',
  'created_at',
]);

export class EmployeeRepository {
  private readonly db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDb();
  }

  public findAll(options: EmployeeFilterOptions): {
    employees: EmployeeWithDepartment[];
    total: number;
  } {
    const {
      page = 1,
      limit = 20,
      search,
      department,
      location,
      status,
      sortBy = 'id',
      sortOrder = 'asc',
    } = options;

    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    // Search filter (name, code, email)
    if (search && search.trim() !== '') {
      const term = `%${search.trim().toLowerCase()}%`;
      whereClauses.push(`(
        LOWER(e.first_name) LIKE ? OR
        LOWER(e.last_name) LIKE ? OR
        LOWER(e.employee_code) LIKE ? OR
        LOWER(e.email) LIKE ?
      )`);
      params.push(term, term, term, term);
    }

    // Department filter (ID or Name)
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

    // Location filter
    if (location && location !== 'All Locations') {
      whereClauses.push('e.location = ?');
      params.push(location);
    }

    // Status filter
    if (status && status !== 'All Statuses') {
      whereClauses.push('e.employment_status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count query
    const countSql = `
      SELECT COUNT(*) as count
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereSql}
    `;
    const totalResult = this.db.prepare(countSql).get(...params) as { count: number };
    const total = totalResult.count;

    // Sorting
    const safeSortBy = ALLOWED_EMPLOYEE_SORT_FIELDS.has(sortBy)
      ? sortBy === 'department_name'
        ? 'd.name'
        : `e.${sortBy}`
      : 'e.id';
    const safeSortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Pagination
    const offset = Math.max(0, (page - 1) * limit);

    const querySql = `
      SELECT
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email,
        e.department_id,
        d.name as department_name,
        d.description as department_description,
        e.location,
        e.job_title,
        e.employment_status,
        e.hire_date,
        e.created_at,
        e.updated_at
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereSql}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const employees = this.db.prepare(querySql).all(...params, limit, offset) as EmployeeWithDepartment[];

    return { employees, total };
  }

  public findById(id: number | string): EmployeeWithDepartment | undefined {
    const isNum = typeof id === 'number' || /^\d+$/.test(String(id));
    const sql = `
      SELECT
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email,
        e.department_id,
        d.name as department_name,
        d.description as department_description,
        e.location,
        e.job_title,
        e.employment_status,
        e.hire_date,
        e.created_at,
        e.updated_at
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${isNum ? 'e.id = ?' : 'e.employee_code = ?'}
    `;
    return this.db.prepare(sql).get(id) as EmployeeWithDepartment | undefined;
  }

  public findByCode(code: string): EmployeeWithDepartment | undefined {
    const sql = `
      SELECT
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email,
        e.department_id,
        d.name as department_name,
        d.description as department_description,
        e.location,
        e.job_title,
        e.employment_status,
        e.hire_date,
        e.created_at,
        e.updated_at
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.employee_code = ?
    `;
    return this.db.prepare(sql).get(code) as EmployeeWithDepartment | undefined;
  }

  public count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as c FROM employees');
    return (stmt.get() as { c: number }).c;
  }
}
