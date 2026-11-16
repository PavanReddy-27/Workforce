import { AuthRepository } from '../repositories/auth.repository';
import type { AuditLogRow } from '../types/auth.types';

export class AuditService {
  constructor(private readonly authRepo = new AuthRepository()) {}

  public log(params: {
    userId?: number | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    details?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): void {
    this.authRepo.createAuditLog(params);
  }

  public getLogs(page = 1, limit = 50): { logs: AuditLogRow[]; total: number } {
    return this.authRepo.getAuditLogs(page, limit);
  }
}
