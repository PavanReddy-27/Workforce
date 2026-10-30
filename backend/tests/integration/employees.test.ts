import { describe, it, beforeEach, afterEach } from 'node:test';
import { expect } from '../helpers/expect';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type { Express } from 'express';
import { createTestDatabase, createTestApp } from '../helpers/testDb';

describe('Employees API Integration Tests', () => {
  let db: Database.Database;
  let app: Express;

  beforeEach(() => {
    db = createTestDatabase(true);
    app = createTestApp(db);
  });

  afterEach(() => {
    db.close();
  });

  it('GET /api/employees returns paginated employees with metadata', async () => {
    const res = await request(app).get('/api/employees');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(20);
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 20,
      totalRecords: 30,
      totalPages: 2,
    });
  });

  it('GET /api/employees respects custom page and limit', async () => {
    const res = await request(app).get('/api/employees?page=2&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(10);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.limit).toBe(10);
  });

  it('GET /api/employees supports search filter', async () => {
    const res = await request(app).get('/api/employees?search=Sarah');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].first_name).toBe('Sarah');
  });

  it('GET /api/employees supports department and location filters', async () => {
    const res = await request(app).get('/api/employees?department=Engineering&location=London%20Tech%20Hub');

    expect(res.status).toBe(200);
    expect(
      res.body.data.every(
        (e: { department_name: string; location: string }) =>
          e.department_name === 'Engineering' && e.location === 'London Tech Hub'
      )
    ).toBe(true);
  });

  it('GET /api/employees supports status filter', async () => {
    const res = await request(app).get('/api/employees?status=Terminated');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].employment_status).toBe('Terminated');
  });

  it('GET /api/employees supports sorting', async () => {
    const resAsc = await request(app).get('/api/employees?sortBy=last_name&sortOrder=asc&limit=5');
    const resDesc = await request(app).get('/api/employees?sortBy=last_name&sortOrder=desc&limit=5');

    expect(resAsc.status).toBe(200);
    expect(resDesc.status).toBe(200);
    expect(resAsc.body.data[0].last_name).not.toBe(resDesc.body.data[0].last_name);
  });

  it('GET /api/employees rejects invalid pagination parameters', async () => {
    const res = await request(app).get('/api/employees?page=0');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');

    const res2 = await request(app).get('/api/employees?limit=200');
    expect(res2.status).toBe(400);
  });

  it('GET /api/employees rejects unsupported sorting fields', async () => {
    const res = await request(app).get('/api/employees?sortBy=password_hash');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/employees rejects invalid sort order', async () => {
    const res = await request(app).get('/api/employees?sortOrder=random');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/employees/:id returns single employee with department details', async () => {
    const res = await request(app).get('/api/employees/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(1);
    expect(res.body.data.employee_code).toBe('EMP-001');
    expect(res.body.data.department_name).toBe('Engineering');
  });

  it('GET /api/employees/:id works with employee_code', async () => {
    const res = await request(app).get('/api/employees/EMP-002');

    expect(res.status).toBe(200);
    expect(res.body.data.employee_code).toBe('EMP-002');
  });

  it('GET /api/employees/:id returns 404 when employee is not found', async () => {
    const res = await request(app).get('/api/employees/99999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMPLOYEE_NOT_FOUND');
  });

  describe('POST /api/employees', () => {
    it('creates a new employee successfully with HTTP 201', async () => {
      const newEmp = {
        first_name: 'Marcus',
        last_name: 'Vance',
        email: 'marcus.vance@stackly.internal',
        department_name: 'Engineering',
        role: 'Site Reliability Engineer',
        location: 'San Francisco HQ',
        employment_status: 'Active',
      };

      const res = await request(app).post('/api/employees').send(newEmp);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.first_name).toBe('Marcus');
      expect(res.body.data.last_name).toBe('Vance');
      expect(res.body.data.employee_code).toBeDefined();
      expect(res.body.data.department_name).toBe('Engineering');
    });

    it('rejects employee creation when required fields are missing', async () => {
      const invalidEmp = {
        first_name: 'Missing',
        // last_name missing
        email: 'missing@stackly.internal',
      };

      const res = await request(app).post('/api/employees').send(invalidEmp);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects employee creation with invalid email format', async () => {
      const invalidEmp = {
        first_name: 'Invalid',
        last_name: 'Email',
        email: 'not-an-email',
        department_name: 'Engineering',
        role: 'Dev',
        location: 'San Francisco HQ',
      };

      const res = await request(app).post('/api/employees').send(invalidEmp);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects employee creation when department does not exist', async () => {
      const invalidEmp = {
        first_name: 'No',
        last_name: 'Dept',
        email: 'no.dept@stackly.internal',
        department_name: 'NonExistentDept999',
        role: 'Consultant',
        location: 'San Francisco HQ',
      };

      const res = await request(app).post('/api/employees').send(invalidEmp);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
