import type { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';
import { sendSuccess, sendError } from '../utils/response';
import type { GetEmployeesQuery, CreateEmployeeBody, UpdateEmployeeBody } from '../schemas/employee.schema';
import { getUserDataScope } from '../middleware/auth.middleware';

export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService = new EmployeeService()) {}

  public getEmployees = (req: Request, res: Response): void => {
    const query = req.query as unknown as GetEmployeesQuery;
    const scope = req.user ? getUserDataScope(req.user) : null;
    if (!scope) {
      sendError(res, 403, 'FORBIDDEN', 'Your account must be linked to an employee record to access workforce data.');
      return;
    }
    const result = this.employeeService.getEmployees({
      ...query,
      ...(scope.employeeId !== undefined ? { employeeId: scope.employeeId } : {}),
      ...(scope.departmentId !== undefined ? { department: String(scope.departmentId) } : {}),
    });

    sendSuccess(res, result.data, 200, {
      pagination: result.pagination,
    });
  };

  public getLocations = (req: Request, res: Response): void => {
    const scope = req.user ? getUserDataScope(req.user) : null;
    if (!scope) {
      sendError(res, 403, 'FORBIDDEN', 'Your account must be linked to an employee record to access workforce data.');
      return;
    }
    const locations = this.employeeService.getLocations({
      ...(scope.employeeId !== undefined ? { employeeId: scope.employeeId } : {}),
      ...(scope.departmentId !== undefined ? { department: String(scope.departmentId) } : {}),
    });
    sendSuccess(res, locations);
  };

  public getEmployeeById = (req: Request, res: Response): void => {
    const id = String(req.params.id);
    const employee = this.employeeService.getEmployeeById(id);

    if (!employee) {
      sendError(res, 404, 'EMPLOYEE_NOT_FOUND', `Employee with ID '${id}' was not found`);
      return;
    }

    const scope = req.user ? getUserDataScope(req.user) : null;
    if (
      !scope ||
      (scope.employeeId !== undefined && employee.id !== scope.employeeId) ||
      (scope.departmentId !== undefined && employee.department_id !== scope.departmentId)
    ) {
      sendError(res, 404, 'EMPLOYEE_NOT_FOUND', `Employee with ID '${id}' was not found`);
      return;
    }

    sendSuccess(res, employee);
  };

  public createEmployee = (req: Request, res: Response): void => {
    const body = req.body as unknown as CreateEmployeeBody;
    const employee = this.employeeService.createEmployee(body);
    sendSuccess(res, employee, 201);
  };

  public updateEmployee = (req: Request, res: Response): void => {
    const id = String(req.params.id);
    const body = req.body as unknown as UpdateEmployeeBody;
    try {
      const employee = this.employeeService.updateEmployee(id, body);
      sendSuccess(res, employee);
    } catch (err) {
      const e = err as Error & { statusCode?: number; code?: string };
      if (e.statusCode === 404) {
        sendError(res, 404, 'EMPLOYEE_NOT_FOUND', e.message);
      } else {
        sendError(res, 400, e.code || 'UPDATE_FAILED', e.message);
      }
    }
  };

  public deleteEmployee = (req: Request, res: Response): void => {
    const id = String(req.params.id);
    const deleted = this.employeeService.deleteEmployee(id);

    if (!deleted) {
      sendError(res, 404, 'EMPLOYEE_NOT_FOUND', `Employee with ID '${id}' was not found`);
      return;
    }

    sendSuccess(res, { id, deleted: true }, 200);
  };

  public exportEmployees = (_req: Request, res: Response): void => {
    const result = this.employeeService.getEmployees({ page: 1, limit: 1000, sortBy: 'id', sortOrder: 'asc' });
    const employees = result.data;
    const headers = ['ID', 'Code', 'First Name', 'Last Name', 'Email', 'Department', 'Location', 'Job Title', 'Status', 'Hire Date'];
    const escapeCsv = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = employees.map((e) =>
      [
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email,
        e.department_name,
        e.location,
        e.job_title,
        e.employment_status,
        e.hire_date,
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csv = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="workforce_employees.csv"');
    res.status(200).send(csv);
  };
}
