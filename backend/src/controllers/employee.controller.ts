import type { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';
import { sendSuccess, sendError } from '../utils/response';
import type { GetEmployeesQuery, CreateEmployeeBody } from '../schemas/employee.schema';

export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService = new EmployeeService()) {}

  public getEmployees = (req: Request, res: Response): void => {
    const query = req.query as unknown as GetEmployeesQuery;
    const result = this.employeeService.getEmployees(query);

    sendSuccess(res, result.data, 200, {
      pagination: result.pagination,
    });
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
}
