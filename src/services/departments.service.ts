/**
 * Centralized Departments API Service
 * Interacts with Sprint 2 REST APIs:
 * - GET /api/departments
 * - GET /api/departments/:id
 */

import { httpClient, type RequestOptions } from './api/httpClient';
import { API_ENDPOINTS } from './api/apiEndpoints';
import type { ApiResponse, Department } from '../types';

export interface IDepartmentService {
  getDepartments(options?: RequestOptions): Promise<ApiResponse<Department[]>>;
  getDepartmentById(id: string | number, options?: RequestOptions): Promise<ApiResponse<Department>>;
}

export class DepartmentApiService implements IDepartmentService {
  async getDepartments(options?: RequestOptions): Promise<ApiResponse<Department[]>> {
    return httpClient.get<Department[]>(API_ENDPOINTS.DEPARTMENTS.BASE, options);
  }

  async getDepartmentById(
    id: string | number,
    options?: RequestOptions
  ): Promise<ApiResponse<Department>> {
    return httpClient.get<Department>(API_ENDPOINTS.DEPARTMENTS.BY_ID(id), options);
  }
}

export const departmentService = new DepartmentApiService();
