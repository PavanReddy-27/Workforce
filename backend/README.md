# Workforce Analytics Platform — Backend REST API & SQLite Database

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

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

---

## 3. Required Environment Variables

Configured in `backend/.env` (validated at runtime with Zod in `src/config/env.ts`):

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | number | `3000` | Port for the HTTP Express server |
| `NODE_ENV` | string | `development` | Environment mode (`development`, `production`, `test`) |
| `CORS_ORIGIN` | string | `http://localhost:5173` | Allowed CORS origins (comma-separated or `*`) |
| `DB_PATH` | string | `./data/workforce.db` | Relative or absolute path to SQLite file |
| `LOG_LEVEL` | string | `info` | Logging verbosity (`error`, `warn`, `info`, `debug`) |

---

## 4. Database Schema & Relationships

The database is built on **SQLite** with Write-Ahead Logging (`WAL`) mode and strict foreign-key enforcement (`PRAGMA foreign_keys = ON`).

### Entity Relationship Model

```
+-----------------------------------+        +----------------------------------------+
|            departments            |        |               employees                |
+-----------------------------------+        +----------------------------------------+
| id          INTEGER PK AUTO       | 1    * | id                INTEGER PK AUTO      |
| name        TEXT UNIQUE NOT NULL  |<-------| employee_code     TEXT UNIQUE NOT NULL |
| description TEXT                  |        | first_name        TEXT NOT NULL        |
| created_at  TEXT NOT NULL (ISO)   |        | last_name         TEXT NOT NULL        |
| updated_at  TEXT NOT NULL (ISO)   |        | email             TEXT UNIQUE NOT NULL |
+-----------------------------------+        | department_id     INTEGER FK -> depts  |
                                             | location          TEXT NOT NULL        |
                                             | job_title         TEXT NOT NULL        |
                                             | employment_status TEXT CHECK (...)     |
                                             | hire_date         TEXT NOT NULL (DATE) |
                                             | created_at        TEXT NOT NULL (ISO)  |
                                             | updated_at        TEXT NOT NULL (ISO)  |
                                             +----------------------------------------+
                                                                 | 1
                                                                 |
                                                                 | *
                                             +----------------------------------------+
                                             |               attendance               |
                                             +----------------------------------------+
                                             | id              INTEGER PK AUTO        |
                                             | employee_id     INTEGER FK -> emps     |
                                             | attendance_date TEXT NOT NULL (DATE)   |
                                             | status          TEXT CHECK (...)       |
                                             | check_in_time   TEXT (ISO Timestamp)   |
                                             | check_out_time  TEXT (ISO Timestamp)   |
                                             | created_at      TEXT NOT NULL (ISO)    |
                                             | updated_at      TEXT NOT NULL (ISO)    |
                                             | UNIQUE(employee_id, attendance_date)   |
                                             +----------------------------------------+
```

### Constraints & Indexes
- **`uq_employee_attendance_date`**: Strict unique constraint preventing duplicate daily attendance for the same employee.
- **Foreign Key Actions**:
  - `departments` -> `employees`: `ON DELETE RESTRICT ON UPDATE CASCADE`
  - `employees` -> `attendance`: `ON DELETE CASCADE ON UPDATE CASCADE`
- **Indexed Fields**: `department_id`, `location`, `employment_status`, `last_name, first_name`, `employee_code`, `attendance_date`, `status`, `(attendance_date, status)`.

---

## 5. Repository Pattern Architecture

The backend strictly separates transport, business logic, and database access:

```
[HTTP Request]
       │
       ▼
[Route & Zod Validation Middleware]  (src/routes/, src/schemas/)
       │
       ▼
[Controller]                         (src/controllers/)
  - Translates HTTP inputs to service calls
  - Formats standard JSON responses
       │
       ▼
[Service]                            (src/services/)
  - Implements business logic and KPI rules
  - Orchestrates repository queries
       │
       ▼
[Repository]                         (src/repositories/)
  - Pure SQL execution using parameterized statements
  - Never leaks SQL syntax to controllers
       │
       ▼
[SQLite Database Engine]             (better-sqlite3)
```

---

## 6. Development, Seeding, Build & Test Commands

Run from the `backend/` directory:

```bash
# Start development server with hot-reload (tsx watch)
npm run dev

# Seed database with sample records (idempotent, safe to rerun)
npm run db:seed

# Run automated unit and integration tests (50 tests)
npm test

# Build production TypeScript bundle into dist/
npm run build

# Start compiled production server
npm start
```

---

## 7. API Endpoints & Query Parameters

All responses use standard JSON envelopes:
- Success: `{ "success": true, "data": ..., "pagination"?: ..., "timestamp": ... }`
- Error: `{ "success": false, "error": { "code": ..., "message": ..., "details"?: ... }, "timestamp": ... }`

### Health & Connectivity
- `GET /api/health`
  - Returns server health, uptime, and database connection status.

### Departments
- `GET /api/departments`
  - Returns all departments from SQLite sorted alphabetically.

### Employees
- `GET /api/employees`
  - Query parameters:
    - `page` (number, default: `1`)
    - `limit` (number, default: `20`, max: `100`)
    - `search` (string, searches first name, last name, code, email)
    - `department` (number or string, department ID or name)
    - `location` (string)
    - `status` (`Active`, `On Leave`, `Terminated`, `Suspended`)
    - `sortBy` (`id`, `employee_code`, `first_name`, `last_name`, `email`, `department_name`, `location`, `job_title`, `employment_status`, `hire_date`, `created_at`)
    - `sortOrder` (`asc`, `desc`, default: `asc`)
- `GET /api/employees/:id`
  - Returns employee with joined department details, or `404` if not found. Supports numeric `id` or string `employee_code`.

### Attendance Records
- `GET /api/attendance`
  - Query parameters:
    - `page` (number, default: `1`)
    - `limit` (number, default: `50`, max: `100`)
    - `employeeId` (number)
    - `date` (ISO `YYYY-MM-DD`)
    - `startDate` & `endDate` (ISO `YYYY-MM-DD`, validates `startDate <= endDate`)
    - `status` (`Present`, `Absent`, `On Leave`)

### Dashboard Metrics & Visualizations
- `GET /api/dashboard/summary`
  - Query parameters:
    - `date` (optional ISO `YYYY-MM-DD`, defaults to most recent attendance date in DB)
    - `department` (optional department filter)
    - `location` (optional location filter)
  - Returns the 5 primary KPI cards:
    - `totalEmployees`: Active employees matching criteria.
    - `presentToday`: Active employees with `'Present'` status on requested date.
    - `absentToday`: Active employees with `'Absent'` status on requested date.
    - `onLeave`: Active employees with `'On Leave'` status on requested date.
    - `attendanceRate`: $\frac{\text{presentToday}}{\text{presentToday} + \text{absentToday} + \text{onLeave}} \times 100$ (returns `0` if denominator is zero).
- `GET /api/dashboard/attendance`
  - Query parameters:
    - `startDate` & `endDate` (ISO `YYYY-MM-DD`)
    - `timeRange` (`7d`, `30d`, `90d`, `1y`, default: `30d`)
    - `department` & `location` (optional)
  - Returns date-grouped presence counts: `present`, `absent`, `onLeave`, `totalRecorded`, and `attendanceRate`.
- `GET /api/dashboard/distribution`
  - Returns real SQL aggregations:
    - `byDepartment`: Headcount and percentage per business unit.
    - `byStatus`: Count and percentage per employment status.

---

## 8. Example Requests & Responses

### 1. Dashboard Summary
```bash
curl http://localhost:3000/api/dashboard/summary?department=Engineering
```
```json
{
  "success": true,
  "data": {
    "totalEmployees": 9,
    "presentToday": 8,
    "absentToday": 1,
    "onLeave": 0,
    "attendanceRate": 88.9,
    "date": "2026-10-30",
    "filtersApplied": {
      "department": "Engineering"
    }
  },
  "timestamp": "2026-10-30T07:11:43.769Z"
}
```

### 2. Paginated Employees Search & Sort
```bash
curl "http://localhost:3000/api/employees?search=Sarah&limit=1"
```
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_code": "EMP-001",
      "first_name": "Sarah",
      "last_name": "Jenkins",
      "email": "sarah.jenkins@stackly.internal",
      "department_id": 1,
      "department_name": "Engineering",
      "department_description": "Core software engineering, platform architecture, and cloud infrastructure",
      "location": "San Francisco HQ",
      "job_title": "Staff ML Infrastructure Engineer",
      "employment_status": "Active",
      "hire_date": "2022-03-15",
      "created_at": "2026-10-30T07:04:32.770Z",
      "updated_at": "2026-10-30T07:04:32.770Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 1,
    "totalRecords": 1,
    "totalPages": 1
  },
  "timestamp": "2026-10-30T07:11:13.806Z"
}
```

### 3. Employee Not Found (404)
```bash
curl http://localhost:3000/api/employees/99999
```
```json
{
  "success": false,
  "error": {
    "code": "EMPLOYEE_NOT_FOUND",
    "message": "Employee with ID '99999' was not found"
  },
  "timestamp": "2026-10-30T07:11:25.780Z"
}
```

### 4. Validation Error (400)
```bash
curl "http://localhost:3000/api/attendance?startDate=2026-10-30&endDate=2026-10-01"
```
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "startDate",
        "message": "startDate must be less than or equal to endDate"
      }
    ]
  },
  "timestamp": "2026-10-30T07:11:00.000Z"
}
```

---

## 9. Troubleshooting & FAQ

- **Database Locked (`SQLITE_BUSY`)**:
  - The connection pool uses `WAL` mode. If locked by external SQLite browser tools, ensure external read/write locks are closed.
- **Foreign Key Violation (`SQLITE_CONSTRAINT_FOREIGNKEY`)**:
  - When creating employees, verify `department_id` exists in the `departments` table.
- **Resetting Database**:
  - Delete `backend/data/workforce.db` and run `npm run db:seed`. The application will automatically recreate tables and seed fresh records.
