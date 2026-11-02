import { DashboardRepository } from '../repositories/dashboard.repository';
import type {
  DashboardSummaryKpis,
  AttendanceTrendItem,
  WorkforceDistribution,
} from '../types';

export interface AttendanceTrendQueryOptions {
  startDate?: string;
  endDate?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  department?: string;
  location?: string;
  status?: string;
  search?: string;
}

export class DashboardService {
  constructor(private readonly dashboardRepo: DashboardRepository = new DashboardRepository()) {}

  public getSummary(options: {
    date?: string;
    department?: string;
    location?: string;
    status?: string;
    search?: string;
  }): DashboardSummaryKpis {
    return this.dashboardRepo.getSummaryKpis(options);
  }

  public getAttendanceTrends(options: AttendanceTrendQueryOptions): AttendanceTrendItem[] {
    const effectiveEndDate = options.endDate || this.dashboardRepo.getEffectiveDate();

    let startDate = options.startDate;
    if (!startDate) {
      const endD = new Date(`${effectiveEndDate}T00:00:00Z`);
      const days = options.timeRange === '7d' ? 7 : options.timeRange === '90d' ? 90 : options.timeRange === '1y' ? 365 : 30;
      endD.setDate(endD.getDate() - days);
      startDate = endD.toISOString().split('T')[0];
    }

    if (startDate > effectiveEndDate) {
      throw new Error('startDate cannot be after endDate');
    }

    return this.dashboardRepo.getAttendanceTrends({
      startDate,
      endDate: effectiveEndDate,
      department: options.department,
      location: options.location,
      status: options.status,
      search: options.search,
    });
  }

  public getWorkforceDistribution(options: {
    department?: string;
    location?: string;
    status?: string;
    search?: string;
  } = {}): WorkforceDistribution {
    return this.dashboardRepo.getWorkforceDistribution(options);
  }
}
