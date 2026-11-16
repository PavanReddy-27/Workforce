import type { Request, Response } from 'express';
import { DepartmentService } from '../services/department.service';
import { sendError, sendSuccess } from '../utils/response';
import { getUserDataScope } from '../middleware/auth.middleware';

export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService = new DepartmentService()) {}

  public getDepartments = (req: Request, res: Response): void => {
    const scope = req.user ? getUserDataScope(req.user) : null;
    if (!scope) {
      sendError(res, 403, 'FORBIDDEN', 'Your account must be linked to an employee record to access department data.');
      return;
    }
    const departments = this.departmentService.getDepartments(scope.departmentId);
    sendSuccess(res, departments);
  };
}
