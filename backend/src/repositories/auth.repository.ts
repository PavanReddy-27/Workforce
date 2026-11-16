import type Database from 'better-sqlite3';
import { getDb } from '../database/connection';
import type {
  UserRow,
  SafeUser,
  UserRole,
  Permission,
  AuditLogRow,
  UserSessionRow,
} from '../types/auth.types';

export class AuthRepository {
  private readonly db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDb();
  }

  // --- User Operations ---

  public getDemoAccounts(): Array<{
    id: number;
    label: string;
    role: UserRole;
    roleDisplay: string;
    email: string;
    defaultPassword?: string;
    description: string;
    isSystemDemo?: boolean;
    departmentName?: string;
  }> {
    const rows = this.db
      .prepare(`
        SELECT
          u.id, u.username, u.email, u.role, u.is_active, u.employee_id,
          e.first_name, e.last_name, e.job_title, d.name AS department_name
        FROM users u
        LEFT JOIN employees e ON u.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE u.is_active = 1
        ORDER BY
          CASE
            WHEN u.email LIKE '%@workforce.com' THEN 0
            ELSE 1
          END,
          CASE u.role
            WHEN 'admin' THEN 1
            WHEN 'hr' THEN 2
            WHEN 'manager' THEN 3
            WHEN 'team_lead' THEN 4
            WHEN 'employee' THEN 5
            ELSE 6
          END,
          u.id ASC
      `)
      .all() as Array<{
        id: number;
        username: string;
        email: string;
        role: UserRole;
        is_active: number;
        employee_id: number | null;
        first_name?: string;
        last_name?: string;
        job_title?: string;
        department_name?: string;
      }>;

    const roleMeta: Record<string, { label: string; roleDisplay: string; passwordHint: string; description: string }> = {
      admin: {
        label: 'Admin',
        roleDisplay: 'System Administrator',
        passwordHint: 'Admin@123456',
        description: 'Full administrative access, user management, audit logs, and settings.',
      },
      hr: {
        label: 'HR Specialist',
        roleDisplay: 'Human Resources',
        passwordHint: 'Hr@123456',
        description: 'Company-wide staff management, attendance records, hiring, and exports.',
      },
      manager: {
        label: 'Manager',
        roleDisplay: 'Department Head',
        passwordHint: 'Manager@123456',
        description: 'Departmental oversight, staff rosters, attendance trends, and approvals.',
      },
      team_lead: {
        label: 'Team Lead',
        roleDisplay: 'Technical Lead',
        passwordHint: 'Lead@123456',
        description: 'Team presence monitoring, daily attendance check, and staff directory.',
      },
      employee: {
        label: 'Employee',
        roleDisplay: 'Individual Contributor',
        passwordHint: 'Employee@123456',
        description: 'Personal workforce dashboard, profile, and self attendance records.',
      },
    };

    return rows.map((u) => {
      const isSystemDemo = u.email.endsWith('@workforce.com');
      const meta = roleMeta[u.role] || {
        label: u.username,
        roleDisplay: u.role,
        passwordHint: 'Stackly@123456',
        description: `Role: ${u.role}`,
      };

      if (!isSystemDemo && u.first_name) {
        const cleanFirst = u.first_name.trim();
        const cleanLast = (u.last_name || '').trim();
        return {
          id: u.id,
          label: `${cleanFirst} ${cleanLast}`,
          role: u.role,
          roleDisplay: u.job_title || meta.roleDisplay,
          email: u.email,
          defaultPassword: `${cleanFirst.charAt(0).toUpperCase() + cleanFirst.slice(1).toLowerCase()}@123456`,
          description: `${u.job_title || meta.roleDisplay} • ${u.department_name || 'Staff'}`,
          isSystemDemo: false,
          departmentName: u.department_name,
        };
      }

      return {
        id: u.id,
        label: meta.label,
        role: u.role,
        roleDisplay: meta.roleDisplay,
        email: u.email,
        defaultPassword: meta.passwordHint,
        description: meta.description,
        isSystemDemo: true,
        departmentName: u.department_name,
      };
    });
  }

  public findByEmail(email: string): UserRow | undefined {
    return this.db
      .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1')
      .get(email.trim()) as UserRow | undefined;
  }

  public findByUsername(username: string): UserRow | undefined {
    return this.db
      .prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1')
      .get(username.trim()) as UserRow | undefined;
  }

  public findById(id: number): UserRow | undefined {
    return this.db
      .prepare('SELECT * FROM users WHERE id = ? LIMIT 1')
      .get(id) as UserRow | undefined;
  }

  public findSafeUserById(id: number): SafeUser | undefined {
    const row = this.db
      .prepare(`
        SELECT
          u.id, u.username, u.email, u.role, u.employee_id, u.is_active,
          u.mfa_enabled, u.last_login_at, u.created_at,
          e.first_name, e.last_name, e.job_title, e.location,
          e.department_id, d.name AS department_name
        FROM users u
        LEFT JOIN employees e ON u.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE u.id = ?
        LIMIT 1
      `)
      .get(id) as (UserRow & {
        first_name?: string;
        last_name?: string;
        job_title?: string;
        location?: string;
        department_name?: string;
        department_id?: number;
      }) | undefined;

    if (!row) return undefined;
    return this.toSafeUser(row);
  }

  public listUsers(page = 1, limit = 50): { users: SafeUser[]; total: number } {
    const offset = Math.max(0, (page - 1) * limit);
    const countRow = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const rows = this.db
      .prepare(`
        SELECT
          u.id, u.username, u.email, u.role, u.employee_id, u.is_active,
          u.mfa_enabled, u.last_login_at, u.created_at,
          e.first_name, e.last_name, e.job_title, e.location,
          e.department_id, d.name AS department_name
        FROM users u
        LEFT JOIN employees e ON u.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        ORDER BY u.id ASC
        LIMIT ? OFFSET ?
      `)
      .all(limit, offset) as (UserRow & {
        first_name?: string;
        last_name?: string;
        job_title?: string;
        location?: string;
        department_name?: string;
        department_id?: number;
      })[];

    return {
      users: rows.map((r) => this.toSafeUser(r)),
      total: countRow.count,
    };
  }

  public createUser(data: {
    username: string;
    email: string;
    password_hash: string;
    role: UserRole;
    employee_id?: number | null;
  }): UserRow {
    const stmt = this.db.prepare(`
      INSERT INTO users (username, email, password_hash, role, employee_id, is_active, mfa_enabled, failed_login_attempts)
      VALUES (?, ?, ?, ?, ?, 1, 0, 0)
    `);
    const result = stmt.run(
      data.username.trim(),
      data.email.trim().toLowerCase(),
      data.password_hash,
      data.role,
      data.employee_id || null
    );

    return this.findById(Number(result.lastInsertRowid))!;
  }

  public updatePassword(userId: number, passwordHash: string): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        UPDATE users
        SET password_hash = ?, password_changed_at = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(passwordHash, now, now, userId);
  }

  public updateUserRole(userId: number, role: UserRole): void {
    const now = new Date().toISOString();
    this.db
      .prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
      .run(role, now, userId);
  }

  public updateUserStatus(userId: number, isActive: boolean): void {
    const now = new Date().toISOString();
    this.db
      .prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?')
      .run(isActive ? 1 : 0, now, userId);
  }

  public updateMfa(
    userId: number,
    enabled: boolean,
    secret: string | null,
    backupCodes: string | null
  ): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        UPDATE users
        SET mfa_enabled = ?, mfa_secret = ?, mfa_backup_codes = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(enabled ? 1 : 0, secret, backupCodes, now, userId);
  }

  public recordSuccessfulLogin(userId: number): void {
    const now = new Date().toISOString();
    this.db
      .prepare(`
        UPDATE users
        SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(now, now, userId);
  }

  public recordFailedLogin(
    userId: number,
    maxAttempts: number,
    lockoutDurationMinutes: number
  ): { locked: boolean; lockedUntil?: string; attempts: number } {
    return this.db.transaction(() => {
      const user = this.findById(userId);
      if (!user) return { locked: false, attempts: 0 };

      const attempts = user.failed_login_attempts + 1;
      const locked = attempts >= maxAttempts;
      const lockedUntil = locked
        ? new Date(Date.now() + lockoutDurationMinutes * 60 * 1000).toISOString()
        : null;
      const now = new Date().toISOString();

      this.db.prepare(`
        UPDATE users
        SET failed_login_attempts = ?, locked_until = ?, updated_at = ?
        WHERE id = ?
      `).run(attempts, lockedUntil, now, userId);

      return { locked, lockedUntil: lockedUntil || undefined, attempts };
    })();
  }

  public resetFailedAttempts(userId: number): void {
    this.db
      .prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?')
      .run(userId);
  }

  // --- Refresh Token Operations (Family & Rotation) ---

  public createRefreshToken(data: {
    userId: number;
    sessionId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: string;
  }): void {
    this.db
      .prepare(`
        INSERT INTO refresh_tokens (user_id, session_id, token_hash, family_id, expires_at, revoked)
        VALUES (?, ?, ?, ?, ?, 0)
      `)
      .run(data.userId, data.sessionId, data.tokenHash, data.familyId, data.expiresAt);
  }

  public rotateRefreshToken(data: {
    currentTokenHash: string;
    userId: number;
    sessionId: string;
    familyId: string;
    replacementTokenHash: string;
    expiresAt: string;
  }): 'rotated' | 'reused' | 'invalid' {
    const rotate = this.db.transaction(() => {
      const current = this.findRefreshToken(data.currentTokenHash);
      if (!current || current.user_id !== data.userId || current.family_id !== data.familyId) {
        return 'invalid' as const;
      }
      if (current.revoked) return 'reused' as const;

      const session = this.findActiveSession(data.sessionId);
      if (!session || session.user_id !== data.userId) return 'invalid' as const;

      const result = this.db
        .prepare('UPDATE refresh_tokens SET revoked = 1, replaced_by_hash = ? WHERE id = ? AND revoked = 0')
        .run(data.replacementTokenHash, current.id);
      if (result.changes !== 1) return 'reused' as const;

      this.db
        .prepare(`
          INSERT INTO refresh_tokens (user_id, session_id, token_hash, family_id, expires_at, revoked)
          VALUES (?, ?, ?, ?, ?, 0)
        `)
        .run(data.userId, data.sessionId, data.replacementTokenHash, data.familyId, data.expiresAt);
      this.db
        .prepare('UPDATE user_sessions SET expires_at = ?, last_activity_at = ? WHERE session_token = ? AND is_active = 1')
        .run(data.expiresAt, new Date().toISOString(), data.sessionId);

      return 'rotated' as const;
    });

    return rotate();
  }

  public findRefreshToken(tokenHash: string): {
    id: number;
    user_id: number;
    token_hash: string;
    family_id: string;
    session_id: string | null;
    expires_at: string;
    revoked: number;
    replaced_by_hash: string | null;
  } | undefined {
    return this.db
      .prepare('SELECT * FROM refresh_tokens WHERE token_hash = ? LIMIT 1')
      .get(tokenHash) as {
      id: number;
      user_id: number;
      token_hash: string;
      family_id: string;
      session_id: string | null;
      expires_at: string;
      revoked: number;
      replaced_by_hash: string | null;
    } | undefined;
  }

  public revokeRefreshToken(tokenHash: string, replacedByHash?: string): void {
    this.db
      .prepare('UPDATE refresh_tokens SET revoked = 1, replaced_by_hash = ? WHERE token_hash = ?')
      .run(replacedByHash || null, tokenHash);
  }

  public revokeFamily(familyId: string): void {
    this.db
      .prepare('UPDATE refresh_tokens SET revoked = 1 WHERE family_id = ?')
      .run(familyId);
  }

  public revokeRefreshTokensBySession(sessionId: string): void {
    this.db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE session_id = ?').run(sessionId);
  }

  public findRefreshSession(tokenHash: string): { session_id: string | null } | undefined {
    return this.db
      .prepare('SELECT session_id FROM refresh_tokens WHERE token_hash = ? LIMIT 1')
      .get(tokenHash) as { session_id: string | null } | undefined;
  }

  public revokeAllUserRefreshTokens(userId: number): void {
    this.db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(userId);
  }

  public createMfaLoginChallenge(jti: string, userId: number, expiresAt: string): void {
    this.db
      .prepare('DELETE FROM mfa_login_challenges WHERE expires_at <= ?')
      .run(new Date().toISOString());
    this.db
      .prepare('INSERT INTO mfa_login_challenges (jti, user_id, expires_at) VALUES (?, ?, ?)')
      .run(jti, userId, expiresAt);
  }

  public isMfaLoginChallengeUsable(jti: string, userId: number): boolean {
    return Boolean(this.db
      .prepare(`
        SELECT 1 FROM mfa_login_challenges
        WHERE jti = ? AND user_id = ? AND consumed = 0 AND expires_at > ?
      `)
      .get(jti, userId, new Date().toISOString()));
  }

  public consumeMfaLoginChallenge(
    jti: string,
    userId: number,
    backupCodes?: { current: string; remaining: string }
  ): boolean {
    const consume = this.db.transaction(() => {
      const challenge = this.db
        .prepare(`
          SELECT jti FROM mfa_login_challenges
          WHERE jti = ? AND user_id = ? AND consumed = 0 AND expires_at > ?
        `)
        .get(jti, userId, new Date().toISOString());
      if (!challenge) return false;

      if (backupCodes) {
        const update = this.db
          .prepare('UPDATE users SET mfa_backup_codes = ? WHERE id = ? AND mfa_backup_codes = ?')
          .run(backupCodes.remaining, userId, backupCodes.current);
        if (update.changes !== 1) return false;
      }

      const update = this.db
        .prepare('UPDATE mfa_login_challenges SET consumed = 1 WHERE jti = ? AND consumed = 0')
        .run(jti);
      return update.changes === 1;
    });

    return consume();
  }

  public deleteExpiredTokens(): void {
    const now = new Date().toISOString();
    this.db
      .prepare('DELETE FROM refresh_tokens WHERE expires_at < ? OR revoked = 1')
      .run(now);
  }

  // --- Login Attempts Logging ---

  public recordLoginAttempt(data: {
    email: string;
    ipAddress: string;
    userAgent?: string;
    success: boolean;
    failureReason?: string;
  }): void {
    this.db
      .prepare(`
        INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(
        data.email,
        data.ipAddress,
        data.userAgent || null,
        data.success ? 1 : 0,
        data.failureReason || null
      );
  }

  // --- Audit Logs ---

  public createAuditLog(data: {
    userId?: number | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    details?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): void {
    const detailsJson = data.details ? JSON.stringify(data.details) : null;
    this.db
      .prepare(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        data.userId || null,
        data.action,
        data.resourceType,
        data.resourceId || null,
        detailsJson,
        data.ipAddress || null,
        data.userAgent || null
      );
  }

  public getAuditLogs(page = 1, limit = 50): { logs: AuditLogRow[]; total: number } {
    const offset = Math.max(0, (page - 1) * limit);
    const countRow = this.db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number };
    const rows = this.db
      .prepare(`
        SELECT
          a.id, a.user_id, a.action, a.resource_type, a.resource_id,
          a.details, a.ip_address, a.user_agent, a.created_at,
          u.username, u.email AS user_email
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(limit, offset) as AuditLogRow[];

    return {
      logs: rows,
      total: countRow.count,
    };
  }

  // --- User Sessions ---

  public createSession(data: {
    userId: number;
    sessionToken: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    expiresAt: string;
  }): UserSessionRow {
    this.db
      .prepare(`
        INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, is_active, last_activity_at, expires_at)
        VALUES (?, ?, ?, ?, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ?)
      `)
      .run(
        data.userId,
        data.sessionToken,
        data.ipAddress || null,
        data.userAgent || null,
        data.expiresAt
      );

    return this.findActiveSession(data.sessionToken)!;
  }

  public findActiveSession(sessionToken: string): UserSessionRow | undefined {
    const now = new Date().toISOString();
    return this.db
      .prepare(`
        SELECT s.*, u.username, u.email as user_email, u.role
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ? AND s.is_active = 1 AND s.expires_at > ?
        LIMIT 1
      `)
      .get(sessionToken, now) as UserSessionRow | undefined;
  }

  public updateSessionActivity(sessionToken: string): void {
    const now = new Date().toISOString();
    this.db
      .prepare('UPDATE user_sessions SET last_activity_at = ? WHERE session_token = ?')
      .run(now, sessionToken);
  }

  public revokeSession(sessionToken: string): void {
    this.db
      .prepare('UPDATE user_sessions SET is_active = 0 WHERE session_token = ?')
      .run(sessionToken);
  }

  public revokeSessionById(sessionId: number, requesterId: number, isAdmin: boolean): boolean {
    const revoke = this.db.transaction(() => {
      const session = this.db
        .prepare('SELECT user_id, session_token FROM user_sessions WHERE id = ?')
        .get(sessionId) as { user_id: number; session_token: string } | undefined;
      if (!session || (!isAdmin && session.user_id !== requesterId)) return false;

      this.db
        .prepare('UPDATE refresh_tokens SET revoked = 1 WHERE session_id = ?')
        .run(session.session_token);
      this.db
        .prepare('UPDATE user_sessions SET is_active = 0 WHERE id = ?')
        .run(sessionId);
      return true;
    });

    return revoke();
  }

  public getUserSessions(userId?: number): UserSessionRow[] {
    const columns = `
      s.id, s.user_id, s.ip_address, s.user_agent, s.is_active,
      s.last_activity_at, s.expires_at, s.created_at,
      u.username, u.email as user_email, u.role
    `;
    if (userId) {
      return this.db
        .prepare(`
          SELECT ${columns}
          FROM user_sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.user_id = ?
          ORDER BY s.last_activity_at DESC
        `)
        .all(userId) as UserSessionRow[];
    }
    return this.db
      .prepare(`
        SELECT ${columns}
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.last_activity_at DESC
        LIMIT 100
      `)
      .all() as UserSessionRow[];
  }

  public revokeAllUserSessions(userId: number): void {
    this.revokeAllUserRefreshTokens(userId);
    this.db
      .prepare('UPDATE user_sessions SET is_active = 0 WHERE user_id = ?')
      .run(userId);
  }

  public revokeOtherUserSessions(userId: number, currentSessionToken?: string): void {
    const revoke = this.db.transaction(() => {
      const sessions = this.db
        .prepare(`
          SELECT session_token FROM user_sessions
          WHERE user_id = ? AND (? IS NULL OR session_token != ?)
        `)
        .all(userId, currentSessionToken || null, currentSessionToken || null) as Array<{ session_token: string }>;
      const revokeRefresh = this.db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE session_id = ?');
      const revokeSession = this.db.prepare('UPDATE user_sessions SET is_active = 0 WHERE session_token = ?');
      for (const session of sessions) {
        revokeRefresh.run(session.session_token);
        revokeSession.run(session.session_token);
      }
    });

    revoke();
  }

  private toSafeUser(
    row: UserRow & {
      first_name?: string;
      last_name?: string;
      job_title?: string;
      location?: string;
      department_name?: string;
      department_id?: number;
    }
  ): SafeUser {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      employee_id: row.employee_id,
      is_active: Boolean(row.is_active),
      mfa_enabled: Boolean(row.mfa_enabled),
      last_login_at: row.last_login_at,
      created_at: row.created_at,
      permissions: this.findPermissionsByRole(row.role),
      employee_details: row.first_name
        ? {
            first_name: row.first_name,
            last_name: row.last_name || '',
            job_title: row.job_title || '',
            department_name: row.department_name,
            department_id: row.department_id,
            location: row.location,
          }
        : null,
    };
  }

  private findPermissionsByRole(role: UserRole): Permission[] {
    const rows = this.db
      .prepare(`
        SELECT permission_name
        FROM role_permissions
        WHERE role_name = ?
        ORDER BY permission_name
      `)
      .all(role) as { permission_name: Permission }[];
    return rows.map((row) => row.permission_name);
  }
}
