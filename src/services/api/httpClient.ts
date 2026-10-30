/**
 * Configurable HTTP Client for REST API Requests
 * Uses fetch with standard environment-based base URL and consistent error contracts.
 */

import type { ApiResponse, ApiError } from '../../types';

export class HttpClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, status: number, code = 'HTTP_ERROR', details?: unknown) {
    super(message);
    this.name = 'HttpClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class HttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api';
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}${cleanPath}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  public async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, params);
  }

  public async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  public async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  public async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        let errorData: ApiError | null = null;
        try {
          errorData = (await response.json()) as ApiError;
        } catch {
          // Response body was not JSON
        }

        const message = errorData?.error?.message || `Request failed with status ${response.status} (${response.statusText})`;
        const code = errorData?.error?.code || `HTTP_${response.status}`;
        throw new HttpClientError(message, response.status, code, errorData?.error?.details);
      }

      const json = (await response.json()) as ApiResponse<T>;
      return json;
    } catch (err) {
      if (err instanceof HttpClientError) {
        throw err;
      }
      const nativeError = err as Error;
      throw new HttpClientError(
        nativeError.message || 'Network request failed. Please check your backend connection.',
        0,
        'NETWORK_FAILURE'
      );
    }
  }
}

// Singleton default HTTP client instance
export const httpClient = new HttpClient();
