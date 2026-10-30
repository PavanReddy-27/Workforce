/**
 * Core Domain Models for Workforce Analytics Platform
 * Represents entities that will map directly to SQLite tables in Sprint 2.
 */

export type EmploymentType = 'Full-Time' | 'Contractor' | 'Part-Time' | 'Intern';
export type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated' | 'Pending';
export type WorkMode = 'In-Office' | 'Remote';
export type AttendanceStatus = 'Present' | 'Absent' | 'On Leave';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  departmentId: string;
  departmentName: string;
  location: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  hireDate: string; // ISO 8601 date string (YYYY-MM-DD)
  avatarUrl?: string;
  managerId?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headcount: number;
  openRoles: number;
  satisfaction: number; // eNPS score (0–100)
  budgetUtilized: number; // percentage (0–100)
  diversityRatio: number; // percentage female/non-binary
  color: string;
  leadEmployeeId?: string;
  leadEmployeeName?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  checkInTime?: string; // ISO 8601 timestamp or HH:MM
  checkOutTime?: string; // ISO 8601 timestamp or HH:MM
  status: AttendanceStatus;
  workMode: WorkMode;
  leaveType?: 'PTO' | 'Parental' | 'Medical' | 'Unexcused';
}

export interface ActivityItem {
  id: string;
  type: 'hire' | 'promotion' | 'leave' | 'transfer' | 'anniversary';
  employeeName: string;
  role: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  timeAgo: string;
  status: 'completed' | 'pending' | 'approved';
  timestamp?: string;
}
