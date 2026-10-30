/**
 * Centralized Employees API Service
 * Interacts with Sprint 2 REST APIs:
 * - GET /api/employees (with search, pagination, sorting, and multi-field filters)
 * - GET /api/employees/:id
 * - POST /api/employees
 * - PUT /api/employees/:id
 * - DELETE /api/employees/:id
 */

import { httpClient, type RequestOptions } from './api/httpClient';
import { API_ENDPOINTS } from './api/apiEndpoints';
import type {
  ApiResponse,
  PaginatedResponse,
  BackendEmployee,
  EmployeeFilterParams,
} from '../types';

export type CreateEmployeeInput = Partial<BackendEmployee> & {
  department?: string;
  role?: string;
};

export interface IEmployeeService {
  getEmployees(
    params?: EmployeeFilterParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<BackendEmployee>>;
  getEmployeeById(
    id: string | number,
    options?: RequestOptions
  ): Promise<ApiResponse<BackendEmployee>>;
  createEmployee(
    employee: CreateEmployeeInput,
    options?: RequestOptions
  ): Promise<ApiResponse<BackendEmployee>>;
  updateEmployee(
    id: string | number,
    updates: Partial<BackendEmployee>,
    options?: RequestOptions
  ): Promise<ApiResponse<BackendEmployee>>;
  deleteEmployee(
    id: string | number,
    options?: RequestOptions
  ): Promise<ApiResponse<{ id: number; deleted: boolean }>>;
}

export class EmployeeApiService implements IEmployeeService {
  async getEmployees(
    params?: EmployeeFilterParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<BackendEmployee>> {
    const queryParams: Record<string, string | number | undefined> = {
      page: params?.page,
      limit: params?.limit ?? params?.pageSize,
      search: params?.search ?? params?.searchQuery,
      department: params?.department ?? params?.departmentId,
      location: params?.location,
      status: params?.status,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    };

    // Strip "All ..." placeholder values
    if (queryParams.department === 'All Departments') delete queryParams.department;
    if (queryParams.location === 'All Locations') delete queryParams.location;
    if (queryParams.status === 'All' || queryParams.status === 'All Statuses') delete queryParams.status;

    const res = await httpClient.get<BackendEmployee[]>(API_ENDPOINTS.EMPLOYEES.BASE, {
      ...options,
      params: queryParams,
    });

    return res as unknown as PaginatedResponse<BackendEmployee>;
  }

  async getEmployeeById(
    id: string | number,
    options?: RequestOptions
  ): Promise<ApiResponse<BackendEmployee>> {
    return httpClient.get<BackendEmployee>(API_ENDPOINTS.EMPLOYEES.BY_ID(id), options);
  }

  async createEmployee(
    employee: CreateEmployeeInput,
    options?: RequestOptions
  ): Promise<ApiResponse<BackendEmployee>> {
    return httpClient.post<BackendEmployee>(API_ENDPOINTS.EMPLOYEES.BASE, employee, options);
  }

  async updateEmployee(
    id: string | number,
    updates: Partial<BackendEmployee>,
    options?: RequestOptions
  ): Promise<ApiResponse<BackendEmployee>> {
    return httpClient.put<BackendEmployee>(API_ENDPOINTS.EMPLOYEES.BY_ID(id), updates, options);
  }

  async deleteEmployee(
    id: string | number,
    options?: RequestOptions
  ): Promise<ApiResponse<{ id: number; deleted: boolean }>> {
    return httpClient.delete<{ id: number; deleted: boolean }>(
      API_ENDPOINTS.EMPLOYEES.BY_ID(id),
      options
    );
  }
}

export const employeeService = new EmployeeApiService();
