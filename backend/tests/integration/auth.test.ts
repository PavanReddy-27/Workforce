import { describe, it, beforeEach, afterEach } from 'node:test';
import { expect } from '../helpers/expect';
import request from 'supertest';
import type Database from 'better-sqlite3';
import type { Express } from 'express';
import { generateSync } from 'otplib';
import { createTestDatabase, createTestApp } from '../helpers/testDb';

describe('Authentication & RBAC Integration Tests', () => {
  let db: Database.Database;
  let app: Express;

  beforeEach(() => {
    db = createTestDatabase(true);
    app = createTestApp(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('POST /api/auth/login', () => {
    it('authenticates admin with valid credentials and returns JWT tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@workforce.com',
          password: 'Admin@123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.user.email).toBe('admin@workforce.com');
      expect(res.body.data.user.permissions.includes('users:manage')).toBe(true);

      const passwordHash = (db.prepare(
        'SELECT password_hash FROM users WHERE email = ?'
      ).get('admin@workforce.com') as { password_hash: string }).password_hash;
      expect(passwordHash).not.toBe('Admin@123456');
      expect(passwordHash.startsWith('$2')).toBe(true);
    });

    it('authenticates employee user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@workforce.com',
          password: 'Employee@123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('employee');
      expect(res.body.data.user.permissions.includes('users:manage')).toBe(false);
      expect(res.body.data.user.permissions.includes('dashboard:view')).toBe(true);
    });

    it('rejects invalid password with 401 and reports remaining attempts', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@workforce.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.details.remainingAttempts).toBe(4);
    });

    it('rejects non-existent email with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@workforce.com',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('enforces account lockout after 5 consecutive failed attempts', async () => {
      // 4 failed attempts
      for (let i = 0; i < 4; i++) {
        const attempt = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'admin@workforce.com',
            password: 'BadPassword!',
          });
        expect(attempt.status).toBe(401);
      }

      // 5th failed attempt triggers lockout (HTTP 423)
      const lockRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@workforce.com',
          password: 'BadPassword!',
        });

      expect(lockRes.status).toBe(423);
      expect(lockRes.body.error.code).toBe('ACCOUNT_LOCKED');

      // Subsequent attempt even with correct password is blocked while locked
      const blockedRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@workforce.com',
          password: 'Admin@123456',
        });

      expect(blockedRes.status).toBe(423);
      expect(blockedRes.body.error.code).toBe('ACCOUNT_LOCKED');
    });

    it('counts simultaneous password failures without losing increments and audits them', async () => {
      const attempts = await Promise.all(
        Array.from({ length: 5 }, () => request(app)
          .post('/api/auth/login')
          .send({ email: 'admin@workforce.com', password: 'BadPassword!' }))
      );

      expect(attempts.filter((attempt) => attempt.status === 423).length).toBe(1);
      expect(attempts.filter((attempt) => attempt.status === 401).length).toBe(4);
      const user = db.prepare(
        'SELECT failed_login_attempts FROM users WHERE email = ?'
      ).get('admin@workforce.com') as { failed_login_attempts: number };
      expect(user.failed_login_attempts).toBe(5);

      const audit = db.prepare(
        "SELECT COUNT(*) AS count FROM audit_logs WHERE action = 'LOGIN_FAILED' AND user_id = (SELECT id FROM users WHERE email = ?)"
      ).get('admin@workforce.com') as { count: number };
      expect(audit.count).toBe(5);
    });
  });

  describe('Refresh Token Rotation & Security', () => {
    it('rotates refresh token and returns new token pair', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'hr@workforce.com',
          password: 'Hr@123456',
        });

      const originalRefreshToken = loginRes.body.data.refreshToken;

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({
          refresh_token: originalRefreshToken,
        });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).not.toBe(originalRefreshToken);

      const profileRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshRes.body.data.accessToken}`);
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.email).toBe('hr@workforce.com');
    });

    it('revokes the active session refresh token on logout', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'hr@workforce.com', password: 'Hr@123456' });
      const { accessToken, refreshToken } = loginRes.body.data;

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refresh_token: refreshToken });
      expect(logoutRes.status).toBe(200);

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: refreshToken });
      expect(refreshRes.status).toBe(401);

      const profileRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(profileRes.status).toBe(401);
    });

    it('revokes all sessions and refresh tokens after a password change', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'hr@workforce.com', password: 'Hr@123456' });
      const { accessToken, refreshToken } = loginRes.body.data;

      const changeRes = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ current_password: 'Hr@123456', new_password: 'SecureNew123' });
      expect(changeRes.status).toBe(200);

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: refreshToken });
      expect(refreshRes.status).toBe(401);

      const newLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'hr@workforce.com', password: 'SecureNew123' });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.data.accessToken).toBeDefined();
    });

    it('detects refresh token reuse and revokes token family (attack prevention)', async () => {
      // Step 1: Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'manager@workforce.com',
          password: 'Manager@123456',
        });

      const token1 = loginRes.body.data.refreshToken;

      // Step 2: Legitimate rotation from token1 -> token2
      const refreshRes1 = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: token1 });

      expect(refreshRes1.status).toBe(200);
      const token2 = refreshRes1.body.data.refreshToken;

      // Step 3: Attacker tries to use already-revoked token1
      const reuseAttackRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: token1 });

      expect(reuseAttackRes.status).toBe(401);
      expect(reuseAttackRes.body.error.code).toBe('TOKEN_REUSE_DETECTED');

      // Step 4: Token family was invalidated; even token2 is now revoked!
      const invalidFamilyRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: token2 });

      expect(invalidFamilyRes.status).toBe(401);
    });
  });

  describe('Protected Routes & Role-Based Access Control (RBAC)', () => {
    it('GET /api/auth/me returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/auth/me returns profile and permissions when authenticated', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@workforce.com',
          password: 'Admin@123456',
        });

      const token = loginRes.body.data.accessToken;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.email).toBe('admin@workforce.com');
      expect(meRes.body.data.role).toBe('admin');
    });

    it('loads permission grants from SQLite for authenticated requests', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@workforce.com', password: 'Admin@123456' });
      const token = loginRes.body.data.accessToken as string;
      expect(loginRes.body.data.user.permissions.includes('users:manage')).toBe(true);

      db.prepare(`
        DELETE FROM role_permissions
        WHERE role_name = 'admin' AND permission_name = 'users:manage'
      `).run();

      const profileRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.permissions.includes('users:manage')).toBe(false);
    });

    it('allows Admin to access GET /api/auth/users', async () => {
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@workforce.com', password: 'Admin@123456' });

      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminLogin.body.data.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it('denies Employee access to GET /api/auth/users with 403 Forbidden', async () => {
      const empLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'employee@workforce.com', password: 'Employee@123456' });

      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${empLogin.body.data.accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('restricts session revocation to the owner or an admin and omits session secrets', async () => {
      const managerLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'manager@workforce.com', password: 'Manager@123456' });
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@workforce.com', password: 'Admin@123456' });
      const employeeLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'employee@workforce.com', password: 'Employee@123456' });
      const managerSessionId = (db.prepare(
        'SELECT id FROM user_sessions WHERE user_id = (SELECT id FROM users WHERE email = ?) ORDER BY id DESC LIMIT 1'
      ).get('manager@workforce.com') as { id: number }).id;

      const sessionsRes = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${employeeLogin.body.data.accessToken}`);
      expect(sessionsRes.status).toBe(200);
      expect(sessionsRes.body.data.every((session: { session_token?: string }) => !session.session_token)).toBe(true);

      const forbiddenRes = await request(app)
        .delete(`/api/auth/sessions/${managerSessionId}`)
        .set('Authorization', `Bearer ${employeeLogin.body.data.accessToken}`);
      expect(forbiddenRes.status).toBe(404);

      const managerProfile = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${managerLogin.body.data.accessToken}`);
      expect(managerProfile.status).toBe(200);

      const adminRevokeRes = await request(app)
        .delete(`/api/auth/sessions/${managerSessionId}`)
        .set('Authorization', `Bearer ${adminLogin.body.data.accessToken}`);
      expect(adminRevokeRes.status).toBe(200);

      const revokedProfile = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${managerLogin.body.data.accessToken}`);
      expect(revokedProfile.status).toBe(401);
    });

    it('allows Admin to delete an employee, but denies Employee role with 403', async () => {
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@workforce.com', password: 'Admin@123456' });

      const empLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'employee@workforce.com', password: 'Employee@123456' });

      // Employee tries to delete -> 403 Forbidden
      const empAttempt = await request(app)
        .delete('/api/employees/1')
        .set('Authorization', `Bearer ${empLogin.body.data.accessToken}`);

      expect(empAttempt.status).toBe(403);

      // Admin tries to delete -> 200 Success
      const adminAttempt = await request(app)
        .delete('/api/employees/1')
        .set('Authorization', `Bearer ${adminLogin.body.data.accessToken}`);

      expect(adminAttempt.status).toBe(200);
    });

    it('limits employee reads while allowing managers to view employees across departments', async () => {
      const employeeLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'employee@workforce.com', password: 'Employee@123456' });
      const employeeToken = employeeLogin.body.data.accessToken as string;
      const employeeProfile = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${employeeToken}`);
      const employeeId = employeeProfile.body.data.employee_id as number;

      expect(employeeProfile.body.data.permissions.includes('employees:read_all')).toBe(false);
      const employeeList = await request(app)
        .get('/api/employees?department=1')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(employeeList.status).toBe(200);
      expect(employeeList.body.data.length).toBe(1);
      expect(employeeList.body.data[0].id).toBe(employeeId);

      const employeeAttendance = await request(app)
        .get('/api/attendance?employeeId=1')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(employeeAttendance.status).toBe(200);
      expect(
        employeeAttendance.body.data.every(
          (record: { employee_id: number }) => record.employee_id === employeeId
        )
      ).toBe(true);

      const managerLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'manager@workforce.com', password: 'Manager@123456' });
      const managerToken = managerLogin.body.data.accessToken as string;
      const managerProfile = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${managerToken}`);
      const departmentId = managerProfile.body.data.employee_details.department_id as number;

      expect(managerProfile.body.data.permissions.includes('employees:read_all')).toBe(true);
      expect(managerProfile.body.data.permissions.includes('attendance:read_all')).toBe(true);
      const managerDistribution = await request(app)
        .get('/api/dashboard/distribution')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(managerDistribution.status).toBe(200);
      expect(managerDistribution.body.data.byDepartment.length).toBe(6);
      expect(managerDistribution.body.data.totalEmployees).toBe(30);

      const managerList = await request(app)
        .get('/api/employees?limit=100')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(managerList.status).toBe(200);
      expect(managerList.body.pagination.totalRecords).toBe(30);
      expect(new Set(managerList.body.data.map((employee: { department_id: number }) => employee.department_id)).size).toBeGreaterThan(1);

      const otherDepartmentEmployee = managerList.body.data.find(
        (employee: { department_id: number }) => employee.department_id !== departmentId
      );
      expect(otherDepartmentEmployee).toBeDefined();
      const otherEmployeeResponse = await request(app)
        .get(`/api/employees/${otherDepartmentEmployee.id}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(otherEmployeeResponse.status).toBe(200);
      expect(otherEmployeeResponse.body.data.department_id).not.toBe(departmentId);

      const managerDepartments = await request(app)
        .get('/api/departments')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(managerDepartments.status).toBe(200);
      expect(managerDepartments.body.data.length).toBe(6);

      const managerLocations = await request(app)
        .get('/api/employees/locations')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(managerLocations.status).toBe(200);
      expect(new Set(managerList.body.data.map((employee: { location: string }) => employee.location)).size)
        .toBe(managerLocations.body.data.length);

      const managerAttendance = await request(app)
        .get(`/api/attendance?employeeId=${otherDepartmentEmployee.id}&limit=100`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(managerAttendance.status).toBe(200);
      expect(managerAttendance.body.data.length).toBeGreaterThan(0);
      expect(
        managerAttendance.body.data.every(
          (record: { employee_id: number }) => record.employee_id === otherDepartmentEmployee.id
        )
      ).toBe(true);

      const managerSummary = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(managerSummary.status).toBe(200);
      expect(managerSummary.body.data.totalEmployees).toBe(30);
    });
  });

  describe('Multi-Factor Authentication (MFA) Flow', () => {
    it('sets up TOTP MFA, verifies code, and enforces MFA challenge on subsequent login', async () => {
      // 1. Login as lead
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'lead@workforce.com', password: 'Lead@123456' });

      const token = loginRes.body.data.accessToken;
      const otherSessionLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'lead@workforce.com', password: 'Lead@123456' });

      // 2. Setup MFA
      const setupRes = await request(app)
        .post('/api/auth/mfa/setup')
        .set('Authorization', `Bearer ${token}`);

      expect(setupRes.status).toBe(200);
      expect(setupRes.body.data.secret).toBeDefined();
      expect(setupRes.body.data.qrCodeUrl.startsWith('data:image/png;base64')).toBe(true);

      const secret = setupRes.body.data.secret;

      // 3. Confirm MFA with TOTP code
      const totpCode = generateSync({ secret });
      const confirmRes = await request(app)
        .post('/api/auth/mfa/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: totpCode });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.data.backupCodes.length).toBe(8);
      const backupCode = confirmRes.body.data.backupCodes[0];

      const otherSessionRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${otherSessionLogin.body.data.accessToken}`);
      expect(otherSessionRes.status).toBe(401);

      const currentSessionRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(currentSessionRes.status).toBe(200);

      // 4. Next login now requires MFA challenge
      const secondLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'lead@workforce.com', password: 'Lead@123456' });

      expect(secondLoginRes.status).toBe(200);
      expect(secondLoginRes.body.data.requiresMfa).toBe(true);
      expect(secondLoginRes.body.data.mfaToken).toBeDefined();

      const mfaToken = secondLoginRes.body.data.mfaToken;

      const challengeProfileRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${mfaToken}`);
      expect(challengeProfileRes.status).toBe(401);

      const storedMfa = db.prepare(
        'SELECT mfa_secret, mfa_backup_codes FROM users WHERE email = ?'
      ).get('lead@workforce.com') as { mfa_secret: string; mfa_backup_codes: string };
      expect(storedMfa.mfa_secret.startsWith('enc:v1:')).toBe(true);
      expect(JSON.parse(storedMfa.mfa_backup_codes)[0]).not.toBe(backupCode);
      expect(JSON.parse(storedMfa.mfa_backup_codes)[0].length).toBe(64);

      // 5. Complete login using the current Google Authenticator TOTP code
      const verifyMfaRes = await request(app)
        .post('/api/auth/login/mfa')
        .send({ mfa_token: mfaToken, code: generateSync({ secret }) });

      expect(verifyMfaRes.status).toBe(200);
      expect(verifyMfaRes.body.data.accessToken).toBeDefined();
      expect(verifyMfaRes.body.data.user.role).toBe('team_lead');

      const replayRes = await request(app)
        .post('/api/auth/login/mfa')
        .send({ mfa_token: mfaToken, code: backupCode });
      expect(replayRes.status).toBe(401);
      expect(replayRes.body.error.code).toBe('MFA_CHALLENGE_USED');

      const nextLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'lead@workforce.com', password: 'Lead@123456' });
      const backupLoginRes = await request(app)
        .post('/api/auth/login/mfa')
        .send({ mfa_token: nextLoginRes.body.data.mfaToken, code: backupCode });
      expect(backupLoginRes.status).toBe(200);
      expect(backupLoginRes.body.data.accessToken).toBeDefined();

      const lastLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'lead@workforce.com', password: 'Lead@123456' });
      const reusedBackupRes = await request(app)
        .post('/api/auth/login/mfa')
        .send({ mfa_token: lastLoginRes.body.data.mfaToken, code: backupCode });
      expect(reusedBackupRes.status).toBe(401);
      expect(reusedBackupRes.body.error.code).toBe('INVALID_MFA_CODE');

      const disableRes = await request(app)
        .post('/api/auth/mfa/disable')
        .set('Authorization', `Bearer ${verifyMfaRes.body.data.accessToken}`)
        .send({ password: 'Lead@123456' });
      expect(disableRes.status).toBe(200);
      expect(disableRes.body.data.mfa_enabled).toBe(false);

      const loginWithoutMfa = await request(app)
        .post('/api/auth/login')
        .send({ email: 'lead@workforce.com', password: 'Lead@123456' });
      expect(loginWithoutMfa.status).toBe(200);
      expect(loginWithoutMfa.body.data.requiresMfa).toBeUndefined();
      expect(loginWithoutMfa.body.data.accessToken).toBeDefined();
    });
  });

  describe('Audit Logging', () => {
    it('records login and role change events in audit_logs table', async () => {
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@workforce.com', password: 'Admin@123456' });

      const token = adminLogin.body.data.accessToken;

      // Get audit logs
      const auditRes = await request(app)
        .get('/api/auth/audit-logs')
        .set('Authorization', `Bearer ${token}`);

      expect(auditRes.status).toBe(200);
      expect(auditRes.body.data.length).toBeGreaterThan(0);
      const actions = auditRes.body.data.map((l: { action: string }) => l.action);
      expect(actions.includes('LOGIN_SUCCESS')).toBe(true);
    });
  });
});
