import { describe, it, beforeEach, afterEach } from 'node:test';
import { expect } from '../helpers/expect';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type { Express } from 'express';
import { createTestDatabase, createTestApp } from '../helpers/testDb';

describe('Attendance API Integration Tests', () => {
  let db: Database.Database;
  let app: Express;

  beforeEach(() => {
    db = createTestDatabase(true);
    app = createTestApp(db);
  });

  afterEach(() => {
    db.close();
  });

  it('GET /api/attendance returns paginated attendance records with employee details', async () => {
    const res = await request(app).get('/api/attendance');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].employee_code).toBeDefined();
    expect(res.body.data[0].department_name).toBeDefined();
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /api/attendance filters by employeeId', async () => {
    const res = await request(app).get('/api/attendance?employeeId=1');

    expect(res.status).toBe(200);
    expect(res.body.data.every((r: { employee_id: number }) => r.employee_id === 1)).toBe(true);
  });

  it('GET /api/attendance filters by status', async () => {
    const res = await request(app).get('/api/attendance?status=Present');

    expect(res.status).toBe(200);
    expect(res.body.data.every((r: { status: string }) => r.status === 'Present')).toBe(true);
  });

  it('GET /api/attendance filters original records by location, employee status, and employee search', async () => {
    const locationRes = await request(app).get(
      '/api/attendance?location=London%20Tech%20Hub'
    );
    const statusRes = await request(app).get(
      '/api/attendance?employeeStatus=On%20Leave'
    );
    const searchRes = await request(app).get('/api/attendance?search=Sarah');

    expect(locationRes.status).toBe(200);
    expect(locationRes.body.data.length).toBeGreaterThan(0);
    expect(locationRes.body.data.every(
      (record: { location: string }) => record.location === 'London Tech Hub'
    )).toBe(true);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.length).toBeGreaterThan(0);
    expect(statusRes.body.data.every(
      (record: { status: string }) => record.status === 'On Leave'
    )).toBe(true);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBeGreaterThan(0);
    expect(searchRes.body.data.every(
      (record: { first_name: string; last_name: string }) =>
        `${record.first_name} ${record.last_name}`.toLowerCase().includes('sarah')
    )).toBe(true);
  });

  it('GET /api/attendance accepts valid date range', async () => {
    const today = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() - 3);
    const threeDaysAgo = d.toISOString().split('T')[0];

    const res = await request(app).get(
      `/api/attendance?startDate=${threeDaysAgo}&endDate=${today}`
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/attendance rejects inverted date range (startDate > endDate)', async () => {
    const res = await request(app).get(
      '/api/attendance?startDate=2026-10-30&endDate=2026-10-01'
    );

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/attendance rejects malformed date format', async () => {
    const res = await request(app).get('/api/attendance?date=30-10-2026');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
