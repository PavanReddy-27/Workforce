/**
 * Centralized Attendance API Service
 * Interacts with Sprint 2 REST APIs:
 * - GET /api/attendance (with employeeId, date, date range, status, and pagination)
 * - POST /api/attendance
 */

import { httpClient, type RequestOptions } from './api/httpClient';
import { API_ENDPOINTS } from './api/apiEndpoints';
import type {
  ApiResponse,
  PaginatedResponse,
  AttendanceRecord,
  AttendanceWithEmployee,
  AttendanceFilterParams,
} from '../types';

export interface IAttendanceService {
  getAttendanceRecords(
    params?: AttendanceFilterParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<AttendanceRecord>>;
  logAttendance(
    record: Omit<AttendanceRecord, 'id'>,
    options?: RequestOptions
  ): Promise<ApiResponse<AttendanceRecord>>;
}

export class AttendanceApiService implements IAttendanceService {
  async getAttendanceRecords(
    params?: AttendanceFilterParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<AttendanceRecord>> {
    const queryParams: Record<string, string | number | undefined> = {
      page: params?.page,
      limit: params?.limit ?? params?.pageSize,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      employeeId: params?.employeeId,
      date: params?.date,
      startDate: params?.startDate,
      endDate: params?.endDate,
      department: params?.department && params.department !== 'All Departments' ? params.department : undefined,
      status: params?.status && params.status !== 'All Statuses' ? params.status : undefined,
    };

    const res = await httpClient.get<AttendanceRecord[]>(API_ENDPOINTS.ATTENDANCE.BASE, {
      ...options,
      params: queryParams,
    });
    return res as unknown as PaginatedResponse<AttendanceRecord>;
  }

  /** Alias that returns AttendanceWithEmployee records (for the Attendance page) */
  async getAttendance(
    params?: AttendanceFilterParams & { startDate?: string; endDate?: string },
    options?: RequestOptions
  ): Promise<PaginatedResponse<AttendanceWithEmployee>> {
    const queryParams: Record<string, string | number | undefined> = {
      page: params?.page,
      limit: params?.limit ?? params?.pageSize,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      employeeId: params?.employeeId,
      date: params?.date,
      startDate: params?.startDate,
      endDate: params?.endDate,
      department: params?.department && params.department !== 'All Departments' ? params.department : undefined,
      status: params?.status && params.status !== 'All Statuses' ? params.status : undefined,
    };

    const res = await httpClient.get<AttendanceWithEmployee[]>(API_ENDPOINTS.ATTENDANCE.BASE, {
      ...options,
      params: queryParams,
    });
    return res as unknown as PaginatedResponse<AttendanceWithEmployee>;
  }

  async logAttendance(
    record: Omit<AttendanceRecord, 'id'>,
    options?: RequestOptions
  ): Promise<ApiResponse<AttendanceRecord>> {
    return httpClient.post<AttendanceRecord>(API_ENDPOINTS.ATTENDANCE.BASE, record, options);
  }
}

export const attendanceService = new AttendanceApiService();
