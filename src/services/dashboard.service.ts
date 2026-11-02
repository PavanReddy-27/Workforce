/**
 * Centralized Dashboard API Service
 * Interacts with Sprint 2 REST APIs:
 * - GET /api/dashboard/summary
 * - GET /api/dashboard/attendance
 * - GET /api/dashboard/distribution
 */

import { httpClient, type RequestOptions } from './api/httpClient';
import { API_ENDPOINTS } from './api/apiEndpoints';
import type {
  ApiResponse,
  BackendDashboardSummary,
  BackendAttendanceTrendItem,
  BackendWorkforceDistribution,
  FilterState,
  KpiMetric,
  AttendanceDataPoint,
  DepartmentMetric,
  DistributionSegment,
} from '../types';

export function calculateDateRange(
  timeRange: string,
  anchorDate?: string
): { startDate: string; endDate: string } {
  // Use anchorDate if provided, or current date
  const anchor = anchorDate ? new Date(anchorDate) : new Date();
  const validEnd = isNaN(anchor.getTime()) ? new Date() : anchor;
  const start = new Date(validEnd);

  switch (timeRange) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case '30d':
    default:
      start.setDate(start.getDate() - 30);
      break;
  }

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  return {
    startDate: formatDate(start),
    endDate: formatDate(validEnd),
  };
}

export function transformSummaryToKpis(summary: BackendDashboardSummary): KpiMetric[] {
  return [
    {
      id: 'total_employees',
      title: 'Total Employees',
      value: summary.totalEmployees.toLocaleString(),
      numericValue: summary.totalEmployees,
      period: 'All employee records',
      subtitle: summary.filtersApplied.status
        ? `${summary.filtersApplied.status} employees`
        : 'Total workforce across all employment statuses',
      badgeColor: '#2563EB',
      iconName: 'people',
      isPositive: true,
    },
    {
      id: 'present_today',
      title: 'Present Today',
      value: summary.presentToday.toLocaleString(),
      numericValue: summary.presentToday,
      period: `Effective Date: ${summary.date}`,
      subtitle: 'Staff recorded present today',
      badgeColor: '#10B981',
      iconName: 'check',
      isPositive: true,
    },
    {
      id: 'absent_today',
      title: 'Absent Today',
      value: summary.absentToday.toLocaleString(),
      numericValue: summary.absentToday,
      period: `Effective Date: ${summary.date}`,
      subtitle: 'Staff recorded absent for the selected date',
      badgeColor: '#EF4444',
      iconName: 'cancel',
      isPositive: false,
    },
    {
      id: 'attendance_rate',
      title: 'Attendance Rate',
      value: `${summary.attendanceRate}%`,
      numericValue: summary.attendanceRate,
      period: 'Present / Recorded active staff',
      subtitle: 'Organizational presence rate',
      badgeColor: '#059669',
      iconName: 'trending_up',
      isPositive: summary.attendanceRate >= 90,
    },
    {
      id: 'on_leave',
      title: 'On Leave',
      value: summary.onLeave.toLocaleString(),
      numericValue: summary.onLeave,
      period: `Effective Date: ${summary.date}`,
      subtitle: 'Employees recorded on leave for the selected date',
      badgeColor: '#D97706',
      iconName: 'event_busy',
      isPositive: true,
    },
  ];
}

export function transformAttendanceTrends(
  items: BackendAttendanceTrendItem[]
): AttendanceDataPoint[] {
  return items.map((item) => ({
    date: item.date,
    present: item.present,
    absent: item.absent,
    onLeave: item.onLeave,
    attendanceRate: item.attendanceRate,
    totalRecorded: item.totalRecorded,
  }));
}

const STATUS_COLORS: Record<string, string> = {
  Active: '#10B981',
  'On Leave': '#F59E0B',
  Terminated: '#EF4444',
  Suspended: '#6B7280',
};

const DEPT_COLORS = ['#2563EB', '#0284C7', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export function transformDistribution(
  dist: BackendWorkforceDistribution
): {
  departmentChartData: DepartmentMetric[];
  workforceDonutSegments: DistributionSegment[];
} {
  const workforceDonutSegments: DistributionSegment[] = dist.byStatus.map((item) => ({
    name: item.status,
    value: item.count,
    percentage: item.percentage,
    color: STATUS_COLORS[item.status] || '#6366F1',
  }));

  const departmentChartData: DepartmentMetric[] = dist.byDepartment.map((item, idx) => ({
    name: item.departmentName,
    headcount: item.headcount,
    color: DEPT_COLORS[idx % DEPT_COLORS.length],
  }));

  return {
    departmentChartData,
    workforceDonutSegments,
  };
}

export interface IDashboardService {
  getSummary(
    filters: FilterState,
    options?: RequestOptions
  ): Promise<ApiResponse<BackendDashboardSummary>>;
  getAttendanceTrends(
    filters: FilterState,
    anchorDate?: string,
    options?: RequestOptions
  ): Promise<ApiResponse<BackendAttendanceTrendItem[]>>;
  getWorkforceDistribution(
    filters?: FilterState,
    options?: RequestOptions
  ): Promise<ApiResponse<BackendWorkforceDistribution>>;
}

export class DashboardApiService implements IDashboardService {
  async getSummary(
    filters: FilterState,
    options?: RequestOptions
  ): Promise<ApiResponse<BackendDashboardSummary>> {
    const params: Record<string, string | number | undefined> = {};
    if (filters.department && filters.department !== 'All Departments') {
      params.department = filters.department;
    }
    if (filters.location && filters.location !== 'All Locations') {
      params.location = filters.location;
    }
    if (filters.employmentType && filters.employmentType !== 'All Types') {
      params.status = filters.employmentType;
    }
    if (filters.searchQuery?.trim()) {
      params.search = filters.searchQuery.trim();
    }

    return httpClient.get<BackendDashboardSummary>(API_ENDPOINTS.DASHBOARD.SUMMARY, {
      ...options,
      params: { ...params, ...options?.params },
    });
  }

  async getAttendanceTrends(
    filters: FilterState,
    anchorDate?: string,
    options?: RequestOptions
  ): Promise<ApiResponse<BackendAttendanceTrendItem[]>> {
    const { startDate, endDate } = calculateDateRange(filters.timeRange, anchorDate);
    const params: Record<string, string | number | undefined> = {
      startDate,
      endDate,
    };
    if (filters.department && filters.department !== 'All Departments') {
      params.department = filters.department;
    }
    if (filters.location && filters.location !== 'All Locations') {
      params.location = filters.location;
    }
    if (filters.employmentType && filters.employmentType !== 'All Types') {
      params.status = filters.employmentType;
    }
    if (filters.searchQuery?.trim()) {
      params.search = filters.searchQuery.trim();
    }

    return httpClient.get<BackendAttendanceTrendItem[]>(API_ENDPOINTS.DASHBOARD.ATTENDANCE, {
      ...options,
      params: { ...params, ...options?.params },
    });
  }

  async getWorkforceDistribution(
    filters?: FilterState,
    options?: RequestOptions
  ): Promise<ApiResponse<BackendWorkforceDistribution>> {
    const params: Record<string, string | undefined> = {};
    if (filters?.department && filters.department !== 'All Departments') {
      params.department = filters.department;
    }
    if (filters?.location && filters.location !== 'All Locations') {
      params.location = filters.location;
    }
    if (filters?.employmentType && filters.employmentType !== 'All Types') {
      params.status = filters.employmentType;
    }
    if (filters?.searchQuery?.trim()) {
      params.search = filters.searchQuery.trim();
    }
    return httpClient.get<BackendWorkforceDistribution>(
      API_ENDPOINTS.DASHBOARD.DISTRIBUTION,
      {
        ...options,
        params: { ...params, ...options?.params },
      }
    );
  }
}

export const dashboardService = new DashboardApiService();
