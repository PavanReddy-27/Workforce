import type { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';
import { sendSuccess, sendError } from '../utils/response';
import type { GetEmployeesQuery, CreateEmployeeBody, UpdateEmployeeBody } from '../schemas/employee.schema';

export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService = new EmployeeService()) {}

  public getEmployees = (req: Request, res: Response): void => {
    const query = req.query as unknown as GetEmployeesQuery;
    const result = this.employeeService.getEmployees(query);

    sendSuccess(res, result.data, 200, {
      pagination: result.pagination,
    });
  };

  public getLocations = (_req: Request, res: Response): void => {
    sendSuccess(res, this.employeeService.getLocations());
  };

  public getEmployeeById = (req: Request, res: Response): void => {
    const id = String(req.params.id);
    const employee = this.employeeService.getEmployeeById(id);

    if (!employee) {
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
