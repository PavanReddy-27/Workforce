# Workforce Analytics Platform — Backend REST API & SQLite Database
## Authentication, Authorization & Role-Based Access Control (RBAC) Module

Enterprise REST API backend for the Stackly Workforce Analytics Platform. Built with Node.js, Express, TypeScript, SQLite (`better-sqlite3`), and the Repository Pattern.

---

## 1. Prerequisites

- **Node.js**: `v18.0.0` or higher (verified on Node `v24.19.0`)
- **npm**: `v9.0.0` or higher (verified on npm `11.17.0`)
- **Operating System**: Windows, macOS, or Linux

---

## 2. Installation & Setup

1. Navigate to the backend directory:
   ```bash
   cd "c:\work\Workforce dashboard\Workforce\backend"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```bash
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   DB_PATH=./data/workforce.db
   LOG_LEVEL=info
   JWT_ACCESS_SECRET=workforce-jwt-access-secret-key-super-secure-32!
   JWT_REFRESH_SECRET=workforce-jwt-refresh-secret-key-super-secure-32!
   MFA_ENCRYPTION_KEY=replace-with-a-random-secret-of-at-least-32-characters
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   MAX_LOGIN_ATTEMPTS=5
   LOCKOUT_DURATION_MINUTES=15
   ```

   For production, configure unique random values of at least 32 characters for
   `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `MFA_ENCRYPTION_KEY`. The JWT
   secrets must differ. The development defaults are rejected in production.
   Keep `MFA_ENCRYPTION_KEY` stable and backed up: it encrypts TOTP secrets in
   the database.

### API security controls

- Login and MFA endpoints are rate-limited per client IP (5 requests/minute in
  production; 20 in development), with separate throttling for sensitive
  authenticated actions and a 120 requests/minute API-wide limit.
- Failed password attempts are incremented transactionally in SQLite so
  concurrent attempts cannot bypass the configured account lockout.
- Credentialed CORS requires explicit origins; wildcard origins are rejected.
  JSON and form request bodies are limited to 32 KB.
- Helmet security headers are enabled. Authentication, lockout, MFA, token
  reuse, and administrative events are written to SQLite audit logs; audit
  write failures are surfaced instead of silently discarded.

---

## 3. Database Schema & Tables

SQLite database with Write-Ahead Logging (`WAL`) mode and strict foreign-key enforcement (`PRAGMA foreign_keys = ON`).

### 12 Tables:
1. `departments`: ID, name, description, timestamps.
2. `employees`: ID, code, first name, last name, email, department FK, location, job title, employment status, hire date.
3. `attendance`: ID, employee FK, attendance date, status, check in/out times.
4. `roles`: Named authorization roles (Admin, HR, Manager, Team Lead, Employee).
5. `permissions`: Named granular permissions such as `employees:read_all`.
6. `role_permissions`: Foreign-key-backed many-to-many role and permission assignments.
7. `users`: ID, username, email, password hash (bcrypt), role, employee FK, active flag, MFA status, TOTP secret, backup codes, failed attempts, locked until.
8. `refresh_tokens`: ID, user FK, token hash, family ID, expiry, revoked flag, replaced by hash.
9. `mfa_login_challenges`: One-time MFA login challenges and expiry.
10. `login_attempts`: ID, email, IP address, user agent, success flag, failure reason.
11. `audit_logs`: ID, user FK, action, resource type, resource ID, JSON details, IP address, user agent.
12. `user_sessions`: ID, user FK, session token, IP address, user agent, active flag, last activity, expiry.

Database initialization creates the role/permission catalog and idempotently
seeds the default assignments. Authenticated user profiles load their
permissions through `role_permissions`, so the API authorization checks use the
SQLite-backed grants.

---

## 4. Default Seeded Accounts

The accounts and passwords below are development/demo credentials only. Never
seed a production database with the demo dataset or expose demo-account
discovery in production. Production startup rejects demo seeding, and the
demo-account endpoint and quick-login UI are disabled in production.

| Role | Email Address | Password | Persona |
|---|---|---|---|
| Admin | `admin@workforce.com` | `Admin@123456` | System Admin |
| HR | `hr@workforce.com` | `Hr@123456` | Amara Okafor (VP Global Talent) |
| Manager | `manager@workforce.com` | `Manager@123456` | Marcus Chen (Director of Product) |
| Team Lead | `lead@workforce.com` | `Lead@123456` | Zainab Al-Mansoor (Frontend Architect) |
| Employee | `employee@workforce.com` | `Employee@123456` | Sarah Jenkins (Staff ML Engineer) |

---

## 5. Seed Database

```bash
npx tsx src/database/seed.ts
```

---

## 6. Run Backend Tests

```bash
npm test
```
The current backend suite contains unit, repository, and integration tests,
including authentication, RBAC, MFA, lockout, token rotation, and API security
coverage. Run the command to see the current test count and results.
