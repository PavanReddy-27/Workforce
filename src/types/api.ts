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
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
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
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardFilterParams {
  department?: string;
  location?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  employmentType?: string;
  searchQuery?: string;
}

export interface EmployeeFilterParams extends PaginationParams {
  departmentId?: string;
  location?: string;
  employmentType?: string;
  status?: string;
  searchQuery?: string;
}

export interface AttendanceFilterParams extends PaginationParams {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  workMode?: 'In-Office' | 'Remote';
  status?: 'Present' | 'Absent' | 'On Leave';
}
