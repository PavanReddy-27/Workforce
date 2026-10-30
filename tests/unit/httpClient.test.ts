import { describe, it } from 'node:test';
import { expect } from '../helpers/expect';
import { HttpClient, HttpClientError } from '../../src/services/api/httpClient';

describe('HttpClient Unit Tests', () => {
  it('should initialize with custom or default baseUrl', () => {
    const client1 = new HttpClient('http://custom-api:8080/api');
    expect(client1).toBeDefined();

    const clientDefault = new HttpClient();
    expect(clientDefault).toBeDefined();
  });

  it('should handle successful GET requests using mock fetch', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      expect(url).toContain('/api/test?status=Active&limit=10');
      expect((init as RequestInit).method).toBe('GET');

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [{ id: 1, name: 'Test' }],
          timestamp: '2026-10-30T00:00:00.000Z',
        }),
      } as unknown as Response;
    };

    try {
      const client = new HttpClient('http://localhost:3000/api');
      const response = await client.get('/test', {
        status: 'Active',
        limit: 10,
        empty: '',
        ignored: undefined,
      });

      expect(response.success).toBe(true);
      expect((response.data as Array<{ id: number }>).length).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should throw HttpClientError with status and code when response is not ok', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Requested employee does not exist',
          },
          timestamp: '2026-10-30T00:00:00.000Z',
        }),
      } as unknown as Response;
    };

    try {
      const client = new HttpClient('http://localhost:3000/api');
      let caught: HttpClientError | null = null;
      try {
        await client.get('/employees/999');
      } catch (err) {
        caught = err as HttpClientError;
      }

      expect(caught).toBeDefined();
      expect(caught?.status).toBe(404);
      expect(caught?.code).toBe('NOT_FOUND');
      expect(caught?.message).toBe('Requested employee does not exist');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should handle request abort / cancellation', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_input, init) => {
      const signal = (init as RequestInit).signal;
      if (signal?.aborted) {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        throw error;
      }
      return new Promise((_, reject) => {
        signal?.addEventListener('abort', () => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    };

    try {
      const client = new HttpClient('http://localhost:3000/api');
      const controller = new AbortController();
      controller.abort(); // pre-aborted

      let caught: HttpClientError | null = null;
      try {
        await client.get('/test', { signal: controller.signal });
      } catch (err) {
        caught = err as HttpClientError;
      }

      expect(caught).toBeDefined();
      expect(caught?.code).toBe('REQUEST_ABORTED');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
