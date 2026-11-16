import { describe, it, beforeEach, afterEach } from 'node:test';
import { expect } from '../helpers/expect';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type { Express } from 'express';
import { createTestDatabase, createTestApp } from '../helpers/testDb';

describe('Health API Integration Tests', () => {
  let db: Database.Database;
  let app: Express;

  beforeEach(() => {
    db = createTestDatabase(true);
    app = createTestApp(db);
  });

  afterEach(() => {
    db.close();
  });

  it('GET /api/health returns 200 with healthy status and database connectivity', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.database.status).toBe('connected');
    expect(res.body.data.database.dialect).toBe('sqlite');
    expect(typeof res.body.data.uptime).toBe('number');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['ratelimit-limit']).toBeDefined();
  });

  it('rejects request bodies exceeding the configured limit', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(`{"email":"admin@workforce.com","password":"${'x'.repeat(33 * 1024)}"}`);

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('GET /api/unknown-endpoint returns 404 with standard error format', async () => {
    const res = await request(app).get('/api/unknown-endpoint');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
