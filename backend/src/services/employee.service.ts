import { EmployeeRepository } from '../repositories/employee.repository';
import type {
  EmployeeWithDepartment,
  EmployeeFilterOptions,
  PaginatedResult,
} from '../types';

export class EmployeeService {
  constructor(private readonly employeeRepo: EmployeeRepository = new EmployeeRepository()) {}

  public getEmployees(options: EmployeeFilterOptions): PaginatedResult<EmployeeWithDepartment> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));

    const { employees, total } = this.employeeRepo.findAll({
      ...options,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: employees,
      pagination: {
        page,
        limit,
        totalRecords: total,
        totalPages,
      },
    };
  }

  public getEmployeeById(id: number | string): EmployeeWithDepartment | null {
    const employee = this.employeeRepo.findById(id);
    return employee || null;
  }

  public createEmployee(data: Parameters<EmployeeRepository['create']>[0]): EmployeeWithDepartment {
    return this.employeeRepo.create(data);
  }
}
