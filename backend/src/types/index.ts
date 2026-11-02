/**
 * Shared Type Definitions for Backend
 */

export interface Department {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type EmploymentStatus = 'Active' | 'On Leave' | 'Terminated' | 'Suspended';
export type AttendanceStatus = 'Present' | 'Absent' | 'On Leave';

export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: number;
  location: string;
  job_title: string;
  employment_status: EmploymentStatus;
  hire_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface EmployeeWithDepartment extends Employee {
  department_name: string;
  department_description: string | null;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  attendance_date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  check_in_time: string | null;
  check_out_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWithEmployee extends AttendanceRecord {
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: number;
  department_name: string;
  location: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export interface EmployeeFilterOptions extends PaginationParams {
  search?: string;
  department?: string; // ID or Name
  location?: string;
  status?: string;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  onLeave: number;
  total: number;
  rate: number;
}

export interface AttendanceFilterOptions extends PaginationParams {
  employeeId?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
  status?: string;
}

export interface DashboardSummaryKpis {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeave: number;
  attendanceRate: number;
  date: string;
  filtersApplied: {
    department?: string;
    location?: string;
    status?: string;
  };
}

export interface AttendanceTrendItem {
  date: string;
  present: number;
  absent: number;
  onLeave: number;
  totalRecorded: number;
  attendanceRate: number;
}

export interface DepartmentDistributionItem {
  departmentId: number;
  departmentName: string;
  headcount: number;
  percentage: number;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  percentage: number;
}

export interface WorkforceDistribution {
  byDepartment: DepartmentDistributionItem[];
  byStatus: StatusDistributionItem[];
  totalEmployees: number;
}
