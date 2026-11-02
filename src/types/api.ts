/**
 * API Contracts & Response Standards
 * Standard envelope used across all backend REST endpoints in Sprint 2.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  pageSize?: number;
  totalCount?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  summary?: {
    present: number;
    absent: number;
    onLeave: number;
    total: number;
    rate: number;
  };
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardFilterParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
  location?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  employmentType?: string;
  searchQuery?: string;
}

export interface EmployeeFilterParams extends PaginationParams {
  search?: string;
  searchQuery?: string;
  department?: string;
  departmentId?: string;
  location?: string;
  status?: string;
  employmentType?: string;
}

export interface AttendanceFilterParams extends PaginationParams {
  employeeId?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
  departmentId?: string;
  workMode?: 'In-Office' | 'Remote';
  status?: string;
}

export interface BackendDashboardSummary {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeave: number;
  attendanceRate: number;
  date: string;
  filtersApplied: {
    department?: string;
    location?: string;
  };
}

export interface BackendAttendanceTrendItem {
  date: string;
  present: number;
  inOffice: number;
  remote: number;
  absent: number;
  onLeave: number;
  totalRecorded: number;
  attendanceRate: number;
}

export interface BackendDepartmentDistributionItem {
  departmentId: number;
  departmentName: string;
  headcount: number;
  percentage: number;
}

export interface BackendStatusDistributionItem {
  status: string;
  count: number;
  percentage: number;
}

export interface BackendWorkforceDistribution {
  byDepartment: BackendDepartmentDistributionItem[];
  byStatus: BackendStatusDistributionItem[];
  totalEmployees: number;
}

export interface BackendEmployee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: number;
  department_name: string;
  department_description: string | null;
  location: string;
  job_title: string;
  employment_status: string;
  hire_date: string;
  created_at: string;
  updated_at: string;
}

