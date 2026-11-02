/**
 * Dashboard & Visualization Types
 * Strictly typed interfaces for KPI metrics, chart series, and filtering.
 */

import type { ActivityItem } from './models';

export type TimeRange = '7d' | '30d' | '90d' | '1y';

export interface FilterState {
  department: string;
  location: string;
  timeRange: TimeRange;
  employmentType: string;
  searchQuery: string;
}

export interface KpiMetric {
  id: 'total_employees' | 'present_today' | 'absent_today' | 'attendance_rate' | 'on_leave';
  title: string;
  value: string;
  numericValue: number;
  change?: number; // percentage change (optional - do not invent if backend doesn't provide)
  isPositive?: boolean; // true = positive business connotation
  period?: string;
  subtitle?: string;
  iconName?: 'people' | 'check' | 'cancel' | 'trending_up' | 'event_busy';
  badgeColor?: string;
}

export interface AttendanceDataPoint {
  date: string;
  present: number;
  absent: number;
  onLeave: number;
  attendanceRate: number; // percentage (0–100)
  totalRecorded?: number;
}

export interface DepartmentMetric {
  name: string;
  headcount: number;
  color: string;
}

export interface DistributionSegment {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface DashboardSummary {
  totalHeadcount: number;
  kpis: KpiMetric[];
  trendPoints: AttendanceDataPoint[];
  departmentChartData: DepartmentMetric[];
  workforceDonutSegments: DistributionSegment[];
  filteredActivities: ActivityItem[];
}
