import type { Request, Response } from 'express';
import { getDb } from '../database/connection';
import { sendSuccess } from '../utils/response';

export class HealthController {
  public getHealth = (_req: Request, res: Response): void => {
    let dbStatus = 'disconnected';

    try {
      const db = getDb();
      const test = db.prepare('SELECT 1 as connected').get() as { connected: number };
      if (test && test.connected === 1) {
        dbStatus = 'connected';
      }
    } catch {
      dbStatus = 'error';
    }

    sendSuccess(res, {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        dialect: 'sqlite',
      },
    });
  };
}
