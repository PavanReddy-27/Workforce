import { describe, it, beforeEach, afterEach } from 'node:test';
import { expect } from '../helpers/expect';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type { Express } from 'express';
import { createTestDatabase, createTestApp } from '../helpers/testDb';

describe('Departments API Integration Tests', () => {
  let db: Database.Database;
  let app: Express;

  beforeEach(() => {
    db = createTestDatabase(true);
    app = createTestApp(db);
  });

  afterEach(() => {
    db.close();
  });

  it('GET /api/departments returns all 6 departments', async () => {
    const res = await request(app).get('/api/departments');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(6);

    const names = res.body.data.map((d: { name: string }) => d.name);
    expect(names).toContain('Engineering');
    expect(names).toContain('Product & Design');
    expect(names).toContain('Sales & Marketing');
    expect(names).toContain('Customer Success');
    expect(names).toContain('Human Resources');
    expect(names).toContain('Finance & Legal');
  });
});
