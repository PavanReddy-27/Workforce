import type { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';
import type {
  GetDashboardSummaryQuery,
  GetDashboardAttendanceQuery,
  GetDashboardDistributionQuery,
} from '../schemas/dashboard.schema';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService = new DashboardService()) {}

  public getSummary = (req: Request, res: Response): void => {
    const query = req.query as unknown as GetDashboardSummaryQuery;
    const summary = this.dashboardService.getSummary(query);
    sendSuccess(res, summary);
  };

  public getAttendance = (req: Request, res: Response): void => {
    const query = req.query as unknown as GetDashboardAttendanceQuery;
    const trends = this.dashboardService.getAttendanceTrends(query);
    sendSuccess(res, trends);
  };

  public getDistribution = (req: Request, res: Response): void => {
    const query = req.query as unknown as GetDashboardDistributionQuery;
    const distribution = this.dashboardService.getWorkforceDistribution(query);
    sendSuccess(res, distribution);
  };
}
