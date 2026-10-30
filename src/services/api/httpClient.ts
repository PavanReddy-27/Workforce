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

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export class HttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    const globalProc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
    const envBaseUrl =
      typeof import.meta !== 'undefined' && import.meta.env
        ? (import.meta.env.VITE_API_BASE_URL as string)
        : globalProc?.env?.VITE_API_BASE_URL;

    this.baseUrl = baseUrl || envBaseUrl || 'http://localhost:3000/api';
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

  public async get<T>(
    path: string,
    paramsOrOptions?: Record<string, string | number | boolean | undefined> | RequestOptions
  ): Promise<ApiResponse<T>> {
    let params: Record<string, string | number | boolean | undefined> | undefined;
    let options: RequestOptions | undefined;

    if (paramsOrOptions && ('signal' in paramsOrOptions || 'timeoutMs' in paramsOrOptions || 'params' in paramsOrOptions)) {
      options = paramsOrOptions as RequestOptions;
      params = options.params;
    } else {
      params = paramsOrOptions as Record<string, string | number | boolean | undefined> | undefined;
    }

    return this.request<T>('GET', path, undefined, params, options);
  }

  public async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, options?.params, options);
  }

  public async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, options?.params, options);
  }

  public async delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options?.params, options);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Manage signal with timeout
    const timeoutMs = options?.timeoutMs ?? 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const compositeSignal: AbortSignal = controller.signal;
    if (options?.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId);
        throw new HttpClientError('Request aborted', 0, 'REQUEST_ABORTED');
      }
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: compositeSignal,
      });

      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
      if (err instanceof HttpClientError) {
        throw err;
      }
      const nativeError = err as Error;
      if (nativeError.name === 'AbortError') {
        throw new HttpClientError('Request was aborted or timed out', 0, 'REQUEST_ABORTED');
      }
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
