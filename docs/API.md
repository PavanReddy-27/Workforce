# Workforce Analytics Platform — REST API Reference

This document provides complete documentation for the REST API endpoints of the **Workforce Analytics Platform**.

Base URL: `http://localhost:3000/api`

---

## 1. Response Formats & Envelopes

All endpoints return a uniform JSON envelope format.

### 1.1. Single Resource Envelope (`ApiResponse<T>`)
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

### 1.2. Paginated Collection Envelope (`PaginatedResponse<T>`)
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 30,
    "totalPages": 2
  },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

### 1.3. Standard Error Envelope (`ErrorResponse`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters provided",
    "details": [
      {
        "field": "limit",
        "message": "Number must be less than or equal to 100"
      }
    ]
  },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

---

## Role-Based Access Control

All business endpoints require a valid access token. Authorization is enforced
on the server using the permissions returned by `GET /api/auth/me`; hiding a
navigation item in the frontend does not grant or deny API access.

| Role | Employee data | Attendance data | Employee changes | Other access |
|---|---|---|---|---|
| Admin | All employees | All attendance | Create, update, delete | User management, audit logs, sessions, exports |
| HR | All employees | All attendance | Create and update | Exports |
| Manager | Linked department | Linked department | Read only | Department-scoped dashboard |
| Team Lead | Linked department | Linked department | Read only | Department-scoped dashboard |
| Employee | Own linked profile | Own attendance | Read own profile | Personal dashboard and security settings |

Manager and Team Lead scope is the department linked to the account because the
current schema does not model team membership. Employee and department filters
provided in requests cannot expand the authenticated user's scope. Scoped
accounts without a linked employee profile receive `403 FORBIDDEN`.

---

## 2. Health & System

### `GET /api/health`
Checks server availability, uptime, and database connectivity.

**Response (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 450.2,
    "database": {
      "status": "connected",
      "dialect": "sqlite"
    }
  },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

---

## 3. Dashboard Analytics

### `GET /api/dashboard/summary`
Calculates the 5 primary KPI cards for the selected date and filters.

The results are scoped to the authenticated user's linked department or employee
profile. Admin and HR accounts can query company-wide data.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|---|---|:---:|---|---|
| `date` | `string` | No | Latest attendance date (today if none) | Target evaluation date |
| `department` | `string` | No | All | Filter by department name |
| `location` | `string` | No | All | Filter by office location |
| `status` | `string` | No | All statuses | `Active`, `On Leave`, `Terminated`, or `Suspended` |
| `search` | `string` | No | - | Substring match against employee name, code, or email |

**Business Calculation Rules**:
- **Total Employees**: Count of all employee records matching department, location, status, and search filters. Without a status filter, all employment statuses are included.
- **Present Today**: Count of active employees whose status for the target date is `'Present'`.
- **Absent Today**: Count of active employees whose status for the target date is `'Absent'`.
- **On Leave**: Count of active employees whose status for the target date is `'On Leave'`.
- **Attendance Rate**: `(Present Today / Total Evaluated Attendance Records) * 100`. If 0 attendance records exist, returns `0%`. Employees without attendance records are not silently assumed absent.

**Response (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "date": "2026-10-30",
    "totalEmployees": 30,
    "presentToday": 27,
    "absentToday": 1,
    "onLeave": 0,
    "attendanceRate": 96.4,
    "filtersApplied": {
      "department": null,
      "location": null,
      "status": null
    }
  },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

---

### `GET /api/dashboard/attendance`
Returns date-grouped attendance status counts and attendance rates.

Results use the same role-based department or employee scope as dashboard
summary data.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|---|---|:---:|---|---|
| `startDate` | `string` | No | 30 days ago | Beginning of date range (`YYYY-MM-DD`) |
| `endDate` | `string` | No | Today | End of date range (`YYYY-MM-DD`) |
| `department` | `string` | No | All | Filter by department name |
| `location` | `string` | No | All | Filter by office location |
| `status` | `string` | No | Active | `Active`, `On Leave`, `Terminated`, or `Suspended` |
| `search` | `string` | No | - | Substring match against employee name, code, or email |

**Response (HTTP 200)**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-10-23",
      "present": 26,
      "absent": 1,
      "onLeave": 1,
      "totalRecorded": 28,
      "attendanceRate": 92.9
    },
    {
      "date": "2026-10-24",
      "present": 27,
      "absent": 1,
      "onLeave": 0,
      "totalRecorded": 28,
      "attendanceRate": 96.4
    }
  ],
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

---

### `GET /api/dashboard/distribution`
Returns SQLite-backed employee breakdowns by department and employment status across all employee records. Search and optional status filters use the same employee population as the summary and directory endpoints.

Results use the authenticated user's scope; filters cannot expand it.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|---|---|:---:|---|---|
| `department` | `string` | No | All | Filter by department name or ID |
| `location` | `string` | No | All | Filter by office location |
| `status` | `string` | No | All statuses | `Active`, `On Leave`, `Terminated`, or `Suspended` |
| `search` | `string` | No | - | Substring match against employee name, code, or email |

**Response (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "totalEmployees": 30,
    "byDepartment": [
      {
        "departmentId": 2,
        "departmentName": "Engineering",
        "headcount": 9,
        "percentage": 31.0
      },
      {
        "departmentId": 5,
        "departmentName": "Product & Design",
        "headcount": 5,
        "percentage": 17.2
      }
    ],
    "byStatus": [
      { "status": "Active", "count": 28, "percentage": 96.6 },
      { "status": "On Leave", "count": 1, "percentage": 3.4 }
    ]
  },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

---

## 4. Employees

### `GET /api/employees`
Lists paginated employee records supporting server-side searching, multi-field filtering, and bidirectional sorting.

Admin and HR can read all employees, Manager and Team Lead are restricted to
their linked department, and Employee accounts can read only their own linked
profile. Caller-supplied department filters never expand this scope.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|---|---|:---:|---|---|
| `page` | `number` | No | 1 | Page number (>= 1) |
| `limit` | `number` | No | 20 | Records per page (1 to 100) |
| `search` | `string` | No | - | Substring match against name, code, or email |
| `department` | `string` | No | - | Department name or ID |
| `location` | `string` | No | - | Office site name |
| `status` | `string` | No | - | `Active`, `On Leave`, `Terminated`, `Suspended` |
| `sortBy` | `string` | No | `id` | Allowed: `id`, `first_name`, `last_name`, `employee_code`, `email`, `department_name`, `location`, `job_title`, `hire_date` |
| `sortOrder` | `string` | No | `asc` | `asc` or `desc` |

**Response (HTTP 200)**:
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
      "department_id": 2,
      "department_name": "Engineering",
      "department_description": "Core software engineering, platform architecture, and cloud infrastructure",
      "location": "San Francisco HQ",
      "job_title": "Staff ML Infrastructure Engineer",
      "employment_status": "Active",
      "hire_date": "2022-03-15",
      "created_at": "2026-10-30T06:00:00.000Z",
      "updated_at": "2026-10-30T06:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 30,
    "totalPages": 2
  },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

---

### `GET /api/employees/locations`
Returns the distinct locations currently stored on employee records.

**Response (HTTP 200)**:
```json
{
  "success": true,
  "data": ["London Tech Hub", "Remote Global", "San Francisco HQ", "Singapore Office"],
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

---

### `GET /api/employees/:id`
Retrieves a single employee record by numeric ID or business employee code.

**Parameters**:
- `id`: Numeric ID (e.g., `1`) or Employee Code (e.g., `EMP-001`).

**Response (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "employee_code": "EMP-001",
    "first_name": "Sarah",
    "last_name": "Jenkins",
    "email": "sarah.jenkins@stackly.internal",
    "department_id": 2,
    "department_name": "Engineering",
    "department_description": "Core software engineering, platform architecture, and cloud infrastructure",
    "location": "San Francisco HQ",
    "job_title": "Staff ML Infrastructure Engineer",
    "employment_status": "Active",
    "hire_date": "2022-03-15",
    "created_at": "2026-10-30T06:00:00.000Z",
    "updated_at": "2026-10-30T06:00:00.000Z"
  },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

**Error (HTTP 404)**:
```json
{
  "success": false,
  "error": {
    "code": "EMPLOYEE_NOT_FOUND",
    "message": "Employee with ID 99999 not found"
  },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

---

### `POST /api/employees`
Creates a new employee record and persists it to the database.

**Request Body Schema**:
```json
{
  "first_name": "Marcus",
  "last_name": "Vance",
  "email": "marcus.vance@stackly.internal",
  "department_name": "Engineering",
  "location": "San Francisco HQ",
  "job_title": "Senior Reliability Engineer",
  "employment_status": "Active",
  "hire_date": "2026-10-30"
}
```
*Note: `department` and `role` are supported as convenient field aliases for `department_name` and `job_title`.*

**Response (HTTP 201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": 31,
    "employee_code": "EMP-031",
    "first_name": "Marcus",
    "last_name": "Vance",
    "email": "marcus.vance@stackly.internal",
    "department_id": 2,
    "department_name": "Engineering",
    "department_description": "Core software engineering, platform architecture, and cloud infrastructure",
    "location": "San Francisco HQ",
    "job_title": "Senior Reliability Engineer",
    "employment_status": "Active",
    "hire_date": "2026-10-30",
    "created_at": "2026-10-30T12:00:00.000Z",
    "updated_at": "2026-10-30T12:00:00.000Z"
  },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

---

### `PUT /api/employees/:id`
Updates an existing employee's details (name, job title, department, location, status, hire date).

**Parameters**:
- `id`: Numeric ID of the employee to update.

**Request Body**:
```json
{
  "first_name": "Sarah",
  "last_name": "Jenkins-Smith",
  "job_title": "Principal ML Infrastructure Engineer",
  "location": "San Francisco HQ",
  "employment_status": "Active"
}
```

**Response (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "employee_code": "EMP-001",
    "first_name": "Sarah",
    "last_name": "Jenkins-Smith",
    "email": "sarah.jenkins@stackly.internal",
    "department_id": 1,
    "department_name": "Engineering",
    "location": "San Francisco HQ",
    "job_title": "Principal ML Infrastructure Engineer",
    "employment_status": "Active",
    "hire_date": "2022-03-15",
    "updated_at": "2026-10-30T14:00:00.000Z"
  },
  "timestamp": "2026-10-30T14:00:00.000Z"
}
```

---

### `DELETE /api/employees/:id`
Permanently deletes an employee record and associated attendance records.

**Parameters**:
- `id`: Numeric ID of the employee to delete.

**Response (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "deleted": true
  },
  "timestamp": "2026-10-30T14:00:00.000Z"
}
```

---

### `GET /api/employees/export`
Exports all employee records as a standard UTF-8 RFC 4180 CSV file with `Content-Disposition: attachment; filename="workforce_employees.csv"`.

**Response (HTTP 200)**:
```csv
"ID","Code","First Name","Last Name","Email","Department","Location","Job Title","Status","Hire Date"
"1","EMP-001","Sarah","Jenkins","sarah.jenkins@stackly.internal","Engineering","San Francisco, CA","Staff ML Infrastructure Engineer","Active","2022-03-15"
...
```

---

## 5. Departments

### `GET /api/departments`
Lists all active organizational departments.

Manager, Team Lead, and Employee accounts receive only their linked department.
Admin and HR accounts receive the full department list.

**Response (HTTP 200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Customer Success",
      "description": "Global customer satisfaction & enterprise support",
      "created_at": "2026-10-30T06:00:00.000Z",
      "updated_at": "2026-10-30T06:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Engineering",
      "description": "Platform architecture, product engineering, & infrastructure",
      "created_at": "2026-10-30T06:00:00.000Z",
      "updated_at": "2026-10-30T06:00:00.000Z"
    }
  ],
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

---

## 6. Attendance

### `GET /api/attendance`
Retrieves paginated daily attendance records.

Admin and HR can read all attendance, Manager and Team Lead are restricted to
their linked department, and Employee accounts can read only their own records.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|---|---|:---:|---|---|
| `page` | `number` | No | 1 | Page number (>= 1) |
| `limit` | `number` | No | 20 | Records per page (1 to 100) |
| `employeeId` | `number` | No | - | Filter by employee ID |
| `department` | `string` | No | - | Filter by department name or ID |
| `date` | `string` | No | - | Single date filter (`YYYY-MM-DD`) |
| `startDate` | `string` | No | - | Range start date (`YYYY-MM-DD`) |
| `endDate` | `string` | No | - | Range end date (`YYYY-MM-DD`) |
| `department` | `string` | No | - | Department name or ID |
| `location` | `string` | No | - | Employee office location |
| `employeeStatus` | `string` | No | - | `Active`, `On Leave`, `Terminated`, or `Suspended` |
| `search` | `string` | No | - | Match employee name, code, or email |
| `status` | `string` | No | - | `Present`, `Absent`, `On Leave` |
| `sortBy` | `string` | No | `attendance_date` | Supported attendance column |
| `sortOrder` | `string` | No | `desc` | `asc` or `desc` |

**Response (HTTP 200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": 1,
      "first_name": "Sarah",
      "last_name": "Jenkins",
      "employee_code": "EMP-001",
      "department_name": "Engineering",
      "attendance_date": "2026-10-30",
      "status": "Present",
      "check_in_time": "2026-10-30T08:45:00.000Z",
      "check_out_time": "2026-10-30T17:30:00.000Z",
      "created_at": "2026-10-30T08:45:00.000Z",
      "updated_at": "2026-10-30T08:45:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 720,
    "totalPages": 36
  },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

---

## 7. Authentication & Sessions

Protected endpoints require an access token in the `Authorization` header:

```http
Authorization: Bearer <accessToken>
```

Passwords are stored as bcrypt hashes. Access tokens are short-lived JWTs;
refresh tokens are rotated on every successful refresh. Reuse of a rotated
refresh token revokes its token family and sessions.

### `POST /api/auth/login`
Request:
```json
{ "email": "user@example.com", "password": "your-password" }
```

Without MFA, `data` contains `accessToken`, `refreshToken`, `expiresIn`, and
the safe user profile. When MFA is enabled, `data` instead contains
`requiresMfa: true` and a short-lived `mfaToken`.

### `POST /api/auth/login/mfa`
Complete an MFA challenge with a TOTP or one-time backup code:
```json
{ "mfa_token": "<short-lived-challenge>", "code": "123456" }
```
Successful verification returns the access and refresh token pair. Backup
codes are single-use.

### `POST /api/auth/refresh`
Rotate the refresh token and receive a new token pair:
```json
{ "refresh_token": "<refreshToken>" }
```
The submitted token is invalidated as part of rotation.

### `POST /api/auth/logout`
Requires authentication. Revokes the current session and its refresh tokens.
The request may include `{ "refresh_token": "<refreshToken>" }`.

### `GET /api/auth/me`
Requires authentication. Returns the current safe user profile and permissions.

### `PUT /api/auth/password`
Requires authentication. Changes the password after verifying the current
password, then terminates all of the user's sessions.
```json
{ "current_password": "current", "new_password": "NewPassword123" }
```

### MFA management
- `POST /api/auth/mfa/setup` — create a TOTP secret and QR code.
- `POST /api/auth/mfa/verify` — confirm setup with `{ "code": "123456" }`;
  returns one-time backup codes.
- `POST /api/auth/mfa/disable` — disable MFA after confirming the password.

TOTP secrets are encrypted at rest. Backup codes are stored as hashes.
Enabling or disabling MFA revokes the user's other sessions.

### Session management
- `GET /api/auth/sessions` — list the caller's sessions; administrators can
  list sessions across users.
- `DELETE /api/auth/sessions/:id` — revoke an owned session or, for an
  administrator, any session.

Session responses do not include session bearer secrets. Demo-account
discovery and demo seeding are development-only.
