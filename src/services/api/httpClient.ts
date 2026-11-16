/**
 * Configurable HTTP Client for REST API Requests
 * Uses fetch with standard environment-based base URL, bearer token injection,
 * automatic refresh-token rotation on 401, and consistent error contracts.
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
  skipAuth?: boolean;
}

export class HttpClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string | null) => void> = [];
  private onSessionExpiredCallback?: () => void;

  constructor(baseUrl?: string) {
    const globalProc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
    const envBaseUrl =
      typeof import.meta !== 'undefined' && import.meta.env
        ? (import.meta.env.VITE_API_BASE_URL as string)
        : globalProc?.env?.VITE_API_BASE_URL;

    this.baseUrl = baseUrl || envBaseUrl || 'http://localhost:3000/api';

    // Hydrate tokens from localStorage if available
    try {
      this.accessToken = localStorage.getItem('wfa_access_token');
      this.refreshToken = localStorage.getItem('wfa_refresh_token');
    } catch {
      // In SSR / non-browser test environments
    }
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  public setTokens(accessToken: string | null, refreshToken: string | null): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    try {
      if (accessToken) {
        localStorage.setItem('wfa_access_token', accessToken);
      } else {
        localStorage.removeItem('wfa_access_token');
      }

      if (refreshToken) {
        localStorage.setItem('wfa_refresh_token', refreshToken);
      } else {
        localStorage.removeItem('wfa_refresh_token');
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getRefreshToken(): string | null {
    return this.refreshToken;
  }

  public onSessionExpired(callback: () => void): void {
    this.onSessionExpiredCallback = callback;
  }

  public clearSession(): void {
    this.handleSessionExpired();
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

    if (paramsOrOptions && ('signal' in paramsOrOptions || 'timeoutMs' in paramsOrOptions || 'params' in paramsOrOptions || 'skipAuth' in paramsOrOptions)) {
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
    options?: RequestOptions,
    isRetry = false
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (!options?.skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

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

      if (
        (response.status === 401 || response.status === 403) &&
        !path.includes('/auth/login') &&
        !path.includes('/auth/refresh')
      ) {
        let errorData: ApiError | null = null;
        try {
          errorData = (await response.clone().json()) as ApiError;
        } catch {
          // ignore
        }

        const code = errorData?.error?.code;
        const authInvalidated =
          response.status === 403 && code === 'ACCOUNT_DEACTIVATED' ||
          response.status === 401 && ['SESSION_INVALIDATED', 'USER_NOT_FOUND'].includes(code || '');

        if (authInvalidated) {
          this.handleSessionExpired();
        } else if (response.status === 401 && code === 'TOKEN_EXPIRED') {
          if (!isRetry && this.refreshToken) {
            try {
              const newToken = await this.performTokenRefresh();
              if (newToken) {
                return this.request<T>(method, path, body, params, options, true);
              }
            } catch {
              this.handleSessionExpired();
            }
          } else {
            this.handleSessionExpired();
          }
        }
      }

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

  private async performTokenRefresh(): Promise<string | null> {
    if (!this.refreshToken) return null;

    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push((token) => resolve(token));
      });
    }

    this.isRefreshing = true;

    try {
      const url = this.buildUrl('/auth/refresh');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!res.ok) {
        this.handleSessionExpired();
        this.notifyRefreshSubscribers(null);
        return null;
      }

      const data = (await res.json()) as { success: boolean; data: { accessToken: string; refreshToken: string } };
      if (data.success && data.data?.accessToken && data.data.refreshToken) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        this.notifyRefreshSubscribers(data.data.accessToken);
        return data.data.accessToken;
      }

      this.handleSessionExpired();
      this.notifyRefreshSubscribers(null);
      return null;
    } catch {
      this.handleSessionExpired();
      this.notifyRefreshSubscribers(null);
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  private handleSessionExpired(): void {
    this.setTokens(null, null);
    if (this.onSessionExpiredCallback) {
      this.onSessionExpiredCallback();
    }
  }

  private notifyRefreshSubscribers(token: string | null): void {
    const subscribers = this.refreshSubscribers;
    this.refreshSubscribers = [];
    subscribers.forEach((subscriber) => subscriber(token));
  }
}

// Singleton default HTTP client instance
export const httpClient = new HttpClient();
