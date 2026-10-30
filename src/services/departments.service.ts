/**
 * Centralized Departments API Service
 * Interacts with Sprint 2 REST APIs:
 * - GET /api/departments
 * - GET /api/departments/:id
 */

import { httpClient, type RequestOptions } from './api/httpClient';
import { API_ENDPOINTS } from './api/apiEndpoints';
import type { ApiResponse, Department } from '../types';

export interface DepartmentRequestOptions extends RequestOptions {
  forceRefresh?: boolean;
}

export interface IDepartmentService {
  getDepartments(options?: DepartmentRequestOptions): Promise<ApiResponse<Department[]>>;
  getDepartmentById(id: string | number, options?: RequestOptions): Promise<ApiResponse<Department>>;
}

export class DepartmentApiService implements IDepartmentService {
  private cache: ApiResponse<Department[]> | null = null;
  private cacheTimestamp = 0;
  private inflightPromise: Promise<ApiResponse<Department[]>> | null = null;
  private readonly CACHE_TTL_MS = 60_000; // 60-second in-memory TTL

  async getDepartments(options?: DepartmentRequestOptions): Promise<ApiResponse<Department[]>> {
    const now = Date.now();
    // Return cached list if still fresh and forceRefresh not requested
    if (!options?.forceRefresh && this.cache && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.cache;
    }

    // Deduplicate concurrent inflight requests
    if (this.inflightPromise && !options?.forceRefresh) {
      return this.inflightPromise;
    }

    this.inflightPromise = (async () => {
      try {
        const response = await httpClient.get<Department[]>(API_ENDPOINTS.DEPARTMENTS.BASE, options);
        if (response.success && response.data) {
          this.cache = response;
          this.cacheTimestamp = Date.now();
        }
        return response;
      } finally {
        this.inflightPromise = null;
      }
    })();

    return this.inflightPromise;
  }

  async getDepartmentById(
    id: string | number,
    options?: RequestOptions
  ): Promise<ApiResponse<Department>> {
    return httpClient.get<Department>(API_ENDPOINTS.DEPARTMENTS.BY_ID(id), options);
  }
}

export const departmentService = new DepartmentApiService();
