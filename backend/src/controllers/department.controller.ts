import type { Request, Response } from 'express';
import { DepartmentService } from '../services/department.service';
import { sendSuccess } from '../utils/response';

export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService = new DepartmentService()) {}

  public getDepartments = (_req: Request, res: Response): void => {
    const departments = this.departmentService.getDepartments();
    sendSuccess(res, departments);
  };
}
