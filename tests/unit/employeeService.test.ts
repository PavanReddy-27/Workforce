import { describe, it } from 'node:test';
import { expect } from '../helpers/expect';
import { employeeService } from '../../src/services/employees.service';

describe('Employee Service Unit Tests', () => {
  it('should format query parameters and strip All-placeholders', async () => {
    const originalFetch = globalThis.fetch;
    let requestedUrl = '';

    globalThis.fetch = async (input) => {
      requestedUrl = String(input);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [
            {
              id: 1,
              employee_code: 'EMP-001',
              first_name: 'Sarah',
              last_name: 'Jenkins',
              email: 'sarah.jenkins@stackly.internal',
              department_id: 1,
              department_name: 'Engineering',
              location: 'San Francisco HQ',
              job_title: 'Staff ML Engineer',
              employment_status: 'Active',
              hire_date: '2022-03-15',
            },
          ],
          pagination: {
            page: 2,
            limit: 10,
            totalRecords: 30,
            totalPages: 3,
          },
          timestamp: '2026-10-30T00:00:00.000Z',
        }),
      } as unknown as Response;
    };

    try {
      const result = await employeeService.getEmployees({
        page: 2,
        pageSize: 10,
        search: 'Sarah',
        department: 'All Departments', // should be stripped
        location: 'San Francisco HQ',
        status: 'All Statuses', // should be stripped
        sortBy: 'first_name',
        sortOrder: 'asc',
      });

      expect(requestedUrl).toContain('page=2');
      expect(requestedUrl).toContain('limit=10');
      expect(requestedUrl).toContain('search=Sarah');
      expect(requestedUrl).toContain('location=San+Francisco+HQ');
      expect(requestedUrl).toContain('sortBy=first_name');
      expect(requestedUrl).toContain('sortOrder=asc');
      expect(requestedUrl).not.toContain('department=');
      expect(requestedUrl).not.toContain('status=');

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.pagination.totalRecords).toBe(30);
      expect(result.pagination.totalPages).toBe(3);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should fetch single employee by id', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      expect(String(input)).toContain('/api/employees/1');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            id: 1,
            employee_code: 'EMP-001',
            first_name: 'Sarah',
            last_name: 'Jenkins',
            email: 'sarah.jenkins@stackly.internal',
          },
          timestamp: '2026-10-30T00:00:00.000Z',
        }),
      } as unknown as Response;
    };

    try {
      const res = await employeeService.getEmployeeById(1);
      expect(res.success).toBe(true);
      expect(res.data.id).toBe(1);
      expect(res.data.employee_code).toBe('EMP-001');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
