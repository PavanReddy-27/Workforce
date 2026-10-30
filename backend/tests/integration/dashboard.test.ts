import { describe, it, beforeEach, afterEach } from 'node:test';
import { expect } from '../helpers/expect';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type { Express } from 'express';
import { createTestDatabase, createTestApp } from '../helpers/testDb';

describe('Dashboard API Integration Tests', () => {
  let db: Database.Database;
  let app: Express;

  beforeEach(() => {
    db = createTestDatabase(true);
    app = createTestApp(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('GET /api/dashboard/summary', () => {
    it('returns the five required KPI cards matching business rules', async () => {
      const res = await request(app).get('/api/dashboard/summary');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalEmployees');
      expect(res.body.data).toHaveProperty('presentToday');
      expect(res.body.data).toHaveProperty('absentToday');
      expect(res.body.data).toHaveProperty('onLeave');
      expect(res.body.data).toHaveProperty('attendanceRate');

      expect(res.body.data.totalEmployees).toBe(28); // 30 seeded - 1 Terminated - 1 On Leave? No, Active employees = 28
      expect(typeof res.body.data.attendanceRate).toBe('number');
      expect(res.body.data.attendanceRate).toBeGreaterThan(0);
      expect(res.body.data.attendanceRate).toBeLessThanOrEqual(100);
    });

    it('filters summary KPIs by department', async () => {
      const res = await request(app).get('/api/dashboard/summary?department=Engineering');

      expect(res.status).toBe(200);
      expect(res.body.data.filtersApplied.department).toBe('Engineering');
      expect(res.body.data.totalEmployees).toBe(9);
    });

    it('filters summary KPIs by location', async () => {
      const res = await request(app).get('/api/dashboard/summary?location=London%20Tech%20Hub');

      expect(res.status).toBe(200);
      expect(res.body.data.filtersApplied.location).toBe('London Tech Hub');
      expect(res.body.data.totalEmployees).toBeGreaterThan(0);
    });

    it('supports explicitly provided date parameter', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app).get(`/api/dashboard/summary?date=${today}`);

      expect(res.status).toBe(200);
      expect(res.body.data.date).toBe(today);
    });

    it('rejects invalid date parameter format', async () => {
      const res = await request(app).get('/api/dashboard/summary?date=invalid-date');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/dashboard/attendance', () => {
    it('returns date-grouped presence counts over time', async () => {
      const res = await request(app).get('/api/dashboard/attendance?timeRange=7d');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const first = res.body.data[0];
      expect(first).toHaveProperty('date');
      expect(first).toHaveProperty('present');
      expect(first).toHaveProperty('absent');
      expect(first).toHaveProperty('onLeave');
      expect(first).toHaveProperty('attendanceRate');
    });

    it('rejects invalid date ranges in attendance trend query', async () => {
      const res = await request(app).get(
        '/api/dashboard/attendance?startDate=2026-10-30&endDate=2026-10-01'
      );

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/dashboard/distribution', () => {
    it('returns department and status distributions aggregated via SQL', async () => {
      const res = await request(app).get('/api/dashboard/distribution');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('byDepartment');
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('totalEmployees');

      expect(res.body.data.byDepartment.length).toBe(6);
      expect(res.body.data.totalEmployees).toBe(29); // 30 seeded - 1 Terminated = 29 active+on leave

      const deptNames = res.body.data.byDepartment.map((d: { departmentName: string }) => d.departmentName);
      expect(deptNames).toContain('Engineering');
    });
  });
});
