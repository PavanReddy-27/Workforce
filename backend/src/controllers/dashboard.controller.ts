import type { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendError, sendSuccess } from '../utils/response';
import type {
  GetDashboardSummaryQuery,
  GetDashboardAttendanceQuery,
  GetDashboardDistributionQuery,
} from '../schemas/dashboard.schema';
import { getUserDataScope } from '../middleware/auth.middleware';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService = new DashboardService()) {}

  public getSummary = (req: Request, res: Response): void => {
    const query = this.scopeQuery(req, req.query as unknown as GetDashboardSummaryQuery, res);
    if (!query) return;
    const summary = this.dashboardService.getSummary(query);
    sendSuccess(res, summary);
  };

  public getAttendance = (req: Request, res: Response): void => {
    const query = this.scopeQuery(req, req.query as unknown as GetDashboardAttendanceQuery, res);
    if (!query) return;
    const trends = this.dashboardService.getAttendanceTrends(query);
    sendSuccess(res, trends);
  };

  public getDistribution = (req: Request, res: Response): void => {
    const query = this.scopeQuery(req, req.query as unknown as GetDashboardDistributionQuery, res);
    if (!query) return;
    const distribution = this.dashboardService.getWorkforceDistribution(query);
    sendSuccess(res, distribution);
  };

  private scopeQuery<T extends { department?: string; employeeId?: number }>(
    req: Request,
    query: T,
    res: Response
  ): T | null {
    const scope = req.user ? getUserDataScope(req.user) : null;
    if (!scope) {
      sendError(res, 403, 'FORBIDDEN', 'Your account must be linked to an employee record to access workforce data.');
      return null;
    }
    return {
      ...query,
      ...(scope.employeeId !== undefined ? { employeeId: scope.employeeId } : {}),
      ...(scope.departmentId !== undefined ? { department: String(scope.departmentId) } : {}),
    };
  }
}
