/**
 * Employee API Service Interface and Implementation
 * Ready for Sprint 2/3 backend endpoints.
 */

import { httpClient } from './api/httpClient';
import { API_ENDPOINTS } from './api/apiEndpoints';
import type {
  ApiResponse,
  PaginatedResponse,
  Employee,
  EmployeeFilterParams,
} from '../types';

export interface IEmployeeService {
  getEmployees(params?: EmployeeFilterParams): Promise<PaginatedResponse<Employee>>;
  getEmployeeById(id: string): Promise<ApiResponse<Employee>>;
  createEmployee(employee: Omit<Employee, 'id'>): Promise<ApiResponse<Employee>>;
  updateEmployee(id: string, updates: Partial<Employee>): Promise<ApiResponse<Employee>>;
  deleteEmployee(id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>>;
}

export class EmployeeApiService implements IEmployeeService {
  async getEmployees(params?: EmployeeFilterParams): Promise<PaginatedResponse<Employee>> {
    const queryParams: Record<string, string | number | undefined> = {
      page: params?.page,
      pageSize: params?.pageSize,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      departmentId: params?.departmentId,
      location: params?.location,
      employmentType: params?.employmentType,
      status: params?.status,
      searchQuery: params?.searchQuery,
    };

    const res = await httpClient.get<Employee[]>(API_ENDPOINTS.EMPLOYEES.BASE, queryParams);
    return res as unknown as PaginatedResponse<Employee>;
  }

  async getEmployeeById(id: string): Promise<ApiResponse<Employee>> {
    return httpClient.get<Employee>(API_ENDPOINTS.EMPLOYEES.BY_ID(id));
  }

  async createEmployee(employee: Omit<Employee, 'id'>): Promise<ApiResponse<Employee>> {
    return httpClient.post<Employee>(API_ENDPOINTS.EMPLOYEES.BASE, employee);
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return httpClient.put<Employee>(API_ENDPOINTS.EMPLOYEES.BY_ID(id), updates);
  }

  async deleteEmployee(id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> {
    return httpClient.delete<{ id: string; deleted: boolean }>(API_ENDPOINTS.EMPLOYEES.BY_ID(id));
  }
}

export const employeeService: IEmployeeService = new EmployeeApiService();
