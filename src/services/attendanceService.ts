/**
 * Attendance API Service Interface and Implementation
 * Ready for Sprint 2/3 backend endpoints.
 */

import { httpClient } from './api/httpClient';
import { API_ENDPOINTS } from './api/apiEndpoints';
import type {
  ApiResponse,
  PaginatedResponse,
  AttendanceRecord,
  AttendanceFilterParams,
} from '../types';

export interface IAttendanceService {
  getAttendanceRecords(params?: AttendanceFilterParams): Promise<PaginatedResponse<AttendanceRecord>>;
  logAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<ApiResponse<AttendanceRecord>>;
}

export class AttendanceApiService implements IAttendanceService {
  async getAttendanceRecords(params?: AttendanceFilterParams): Promise<PaginatedResponse<AttendanceRecord>> {
    const queryParams: Record<string, string | number | undefined> = {
      page: params?.page,
      pageSize: params?.pageSize,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      startDate: params?.startDate,
      endDate: params?.endDate,
      departmentId: params?.departmentId,
      workMode: params?.workMode,
      status: params?.status,
    };

    const res = await httpClient.get<AttendanceRecord[]>(API_ENDPOINTS.ATTENDANCE.BASE, queryParams);
    return res as unknown as PaginatedResponse<AttendanceRecord>;
  }

  async logAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<ApiResponse<AttendanceRecord>> {
    return httpClient.post<AttendanceRecord>(API_ENDPOINTS.ATTENDANCE.LOG, record);
  }
}

export const attendanceService: IAttendanceService = new AttendanceApiService();
