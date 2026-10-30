/**
 * Department API Service Interface and Implementation
 * Ready for Sprint 2/3 backend endpoints.
 */

import { httpClient } from './api/httpClient';
import { API_ENDPOINTS } from './api/apiEndpoints';
import type { ApiResponse, Department } from '../types';

export interface IDepartmentService {
  getDepartments(): Promise<ApiResponse<Department[]>>;
  getDepartmentById(id: string): Promise<ApiResponse<Department>>;
}

export class DepartmentApiService implements IDepartmentService {
  async getDepartments(): Promise<ApiResponse<Department[]>> {
    return httpClient.get<Department[]>(API_ENDPOINTS.DEPARTMENTS.BASE);
  }

  async getDepartmentById(id: string): Promise<ApiResponse<Department>> {
    return httpClient.get<Department>(API_ENDPOINTS.DEPARTMENTS.BY_ID(id));
  }
}

export const departmentService: IDepartmentService = new DepartmentApiService();
