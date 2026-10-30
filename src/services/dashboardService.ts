/**
 * Dashboard API Service
 * Encapsulates dashboard summary, metrics, and visualization data queries.
 */

import { httpClient } from './api/httpClient';
import { API_ENDPOINTS } from './api/apiEndpoints';
import type {
  ApiResponse,
  DashboardSummary,
  AttendanceDataPoint,
  DistributionSegment,
  FilterState,
} from '../types';
import { getFilteredWorkforceData } from '../data/mockData';

export interface IDashboardService {
  getSummary(filters: FilterState): Promise<ApiResponse<DashboardSummary>>;
  getAttendanceTrends(filters: FilterState): Promise<ApiResponse<AttendanceDataPoint[]>>;
  getWorkforceDistribution(filters: FilterState): Promise<ApiResponse<DistributionSegment[]>>;
}

/**
 * Real API-backed implementation (for Sprint 2/3 SQLite REST backend)
 */
export class DashboardApiService implements IDashboardService {
  async getSummary(filters: FilterState): Promise<ApiResponse<DashboardSummary>> {
    return httpClient.get<DashboardSummary>(API_ENDPOINTS.DASHBOARD.SUMMARY, {
      department: filters.department,
      location: filters.location,
      timeRange: filters.timeRange,
      employmentType: filters.employmentType,
      searchQuery: filters.searchQuery,
    });
  }

  async getAttendanceTrends(filters: FilterState): Promise<ApiResponse<AttendanceDataPoint[]>> {
    return httpClient.get<AttendanceDataPoint[]>(API_ENDPOINTS.DASHBOARD.ATTENDANCE_TRENDS, {
      department: filters.department,
      location: filters.location,
      timeRange: filters.timeRange,
    });
  }

  async getWorkforceDistribution(filters: FilterState): Promise<ApiResponse<DistributionSegment[]>> {
    return httpClient.get<DistributionSegment[]>(API_ENDPOINTS.DASHBOARD.WORKFORCE_DISTRIBUTION, {
      department: filters.department,
      location: filters.location,
      employmentType: filters.employmentType,
    });
  }
}

/**
 * Mock-backed implementation used by Sprint 1 / Task 1 to keep current UI operational
 */
export class DashboardMockService implements IDashboardService {
  async getSummary(filters: FilterState): Promise<ApiResponse<DashboardSummary>> {
    const data = getFilteredWorkforceData(filters);
    return {
      success: true,
      data: {
        totalHeadcount: data.totalHeadcount,
        kpis: data.kpis,
        trendPoints: data.trendPoints,
        departmentChartData: data.departmentChartData,
        workforceDonutSegments: data.workforceDonutSegments,
        filteredActivities: data.filteredActivities,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getAttendanceTrends(filters: FilterState): Promise<ApiResponse<AttendanceDataPoint[]>> {
    const data = getFilteredWorkforceData(filters);
    return {
      success: true,
      data: data.trendPoints,
      timestamp: new Date().toISOString(),
    };
  }

  async getWorkforceDistribution(filters: FilterState): Promise<ApiResponse<DistributionSegment[]>> {
    const data = getFilteredWorkforceData(filters);
    return {
      success: true,
      data: data.workforceDonutSegments,
      timestamp: new Date().toISOString(),
    };
  }
}

// Current service instance (defaults to MockService for Sprint 1 preservation)
export const dashboardService: IDashboardService = new DashboardMockService();
