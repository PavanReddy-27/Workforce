# Sprint 4: Workforce Analytics Platform — Quality Assurance & Optimization Plan

## 1. Executive Summary & Objectives

Sprint 4 focuses on **Testing, Quality Assurance, Security Hardening, Accessibility, and Performance Optimization** for the Workforce Analytics Platform. Building on the foundation of Sprint 1 (Frontend Architecture), Sprint 2 (SQLite Backend & Repository Pattern), and Sprint 3 (REST API Integration), this phase ensures the application is robust, resilient to edge cases, secure against vulnerabilities, performant under concurrent load, accessible, and ready for production demonstration.

---

## 2. System Inspection & Current State Inventory

### 2.1. Environment & Architecture
- **Frontend**: Vite 8, React 19, TypeScript 6, Material UI (MUI v9), Recharts v3.
- **Backend**: Node.js, Express 4.21, TypeScript 5.8, `better-sqlite3` 13.0, Zod 3.24, Helmet 8.0, CORS 2.8.
- **Active Branch**: `feature/task-4-qa-optimization` (branched from verified `feature/task-3-integration`).
- **Running Services**:
  - Express REST API daemon at `http://localhost:3000/api`
  - Vite Frontend dev server at `http://localhost:5173`

### 2.2. Current Verification Baseline
- **Frontend TypeScript (`tsc -b`)**: Passing (0 errors).
- **Backend TypeScript (`tsc`)**: Passing (0 errors).
- **ESLint (`eslint .`)**: Passing (0 errors, 0 warnings).
- **Automated Tests**:
  - Frontend & Live Integration: 18 tests passing.
  - Backend Unit & Integration: 50 tests passing.

---

## 3. Discovered Issues, Severity, and Remediation Plan

The following issues and enhancement areas were identified during the initial code and security inspection:

| Issue ID | Area | Description | Severity | Remediation Plan |
|---|---|---|---|---|
| **QA-01** | Functional / API | The "Initiate New Hire Requisition" dialog in `App.tsx` does not persist newly hired employees to the database; it only closes the modal and displays a local snackbar. | **Medium** | Implement `POST /api/employees` on the backend with Zod schema validation, add `createEmployee` to `EmployeeRepository`, wire frontend modal submission to `employeeService.createEmployee`, and automatically trigger dashboard and employee table refetch. |
| **QA-02** | UX / Charts | When filters return zero records, `AttendanceTrendChart` and `DepartmentDistributionChart` render empty SVG axes without a clear empty-state visual indicator. | **Low** | Add empty dataset guard clauses in `AttendanceTrendChart` and `DepartmentDistributionChart` rendering an informative empty state with a reset filter action. |
| **QA-03** | Accessibility (a11y) | Missing explicit `aria-label` attributes on filter `ToggleButtonGroup`s, table search input, and icon action buttons in the topbar. | **Medium** | Add comprehensive ARIA labels, input accessible names, and verify keyboard focus indicators across light and dark themes. |
| **QA-04** | Security / Audit | `npm audit` flagged dependencies: Zod 3.24.2 constrained collection advisory (GHSA-mrhx-c7xc-m3w5) and unused devDependency `vitest`. | **Low** | Audit input collection constraints in Zod schemas (ensure all string and array inputs enforce `.max()`); evaluate safe dependency updates. |
| **QA-05** | Performance | Department options are fetched independently on mount by both `DashboardFilters` and `EmployeeTable`, resulting in redundant network calls. | **Low** | Add a lightweight in-memory cache/deduplication in `DepartmentApiService` so concurrent or repeated calls resolve immediately without duplicate HTTP requests. |
| **QA-06** | Reliability / Edge Cases | Edge case testing required for: empty database state (0 employees, 0 attendance), midnight date transitions, single-employee filter subsets, and SQL wildcard escaping in employee search. | **Medium** | Create automated edge-case test suites validating empty database behavior, zero attendance records, and search special characters (`%`, `_`). |

---

## 4. Functional Testing Plan

### 4.1. Dashboard KPIs
- **Calculations Under Normal Data**: Total Employees (28 active), Present Today (27), Absent Today (1), On Leave (0), Attendance Rate (96.4%).
- **Empty Database**: 0 employees, 0 present, 0 absent, 0 on leave, 0% attendance rate (no `NaN` or `undefined`).
- **Unrecorded Employees**: Verify that employees without attendance records for the effective date are not silently counted as absent (strictly honoring business rules).
- **Date Changes**: Verify behavior when explicitly querying dates in the past or future.

### 4.2. Charts
- **Attendance Trend Chart**: Stacked areas for in-office vs. remote vs. leave; attendance rate toggle; empty state on zero matches.
- **Workforce Status Chart**: Segments for Active, On Leave, Terminated; center label matches total headcount; empty state on zero records.
- **Department Distribution Chart**: 6 departments; headcount comparison; bar-click filtering; empty state on zero records.

### 4.3. Employee Directory Table
- **Search**: Case-insensitive search on `first_name`, `last_name`, `employee_code`, and `email` with 300ms debounce.
- **Filters**: Single and combined filtering by department, location, and employment status.
- **Sorting**: Ascending and descending sorting on all supported columns.
- **Pagination**: Server-side page slicing; page resets to 1 when search or filter criteria change.
- **Error & Retry**: Clean alert display with Retry button on API disconnect.

---

## 5. Security & Reliability Plan

### 5.1. SQL Injection Prevention
- Confirm all SQL statements in `repositories/` use parameterized inputs (`?`).
- Verify `ALLOWED_EMPLOYEE_SORT_FIELDS` whitelisting in `EmployeeRepository`.

### 5.2. Input Validation
- Review all Zod schemas in `backend/src/schemas/`:
  - Enforce bounds on pagination (`page >= 1`, `limit <= 100`).
  - Validate date formats (`YYYY-MM-DD`).
  - Sanitize text inputs.

### 5.3. Headers & CORS
- Verify Helmet security headers: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`.
- Verify CORS allowed origin whitelist against environment settings.

### 5.4. Data Integrity & Concurrency
- Verify foreign key enforcement (`PRAGMA foreign_keys = ON;`).
- Verify unique constraints: department names, employee codes, emails, `(employee_id, attendance_date)`.
- Verify atomic operations are wrapped in transactions.

---

## 6. Performance Optimization Plan

1. **Request Deduplication**: Cache department list for 60 seconds in `DepartmentApiService`.
2. **Debounced Search**: 300ms debounce with request cancellation via `AbortController`.
3. **Database Indexes**: Verify indexes on `department_id`, `location`, `employment_status`, `employee_code`, `attendance_date`, and `status`.
4. **Memoization**: Verify React component re-render frequency using stable callbacks and memoized theme objects.

---

## 7. Accessibility (a11y) & Responsive Verification

- **Keyboard Navigation**: Tab key navigation through sidebar, topbar search, filters, chart view toggles, table headers, and pagination controls.
- **Screen Reader Support**: ARIA attributes on icon buttons, form controls, and dialogs.
- **Color Contrast**: Verify text contrast against background in both light (`#F8FAFC` surface, `#0F172A` text) and dark (`#0F172A` background, `#F8FAFC` text) modes.
- **Breakpoints**: Verify Desktop (>=1200px), Tablet (768px–1199px), and Mobile (<768px).

---

## 8. Implementation & Verification Results

### 8.1. Summary of Implemented Fixes
1. **QA-01 (New Hire Requisition Persistence)**:
   - Created `createEmployeeBodySchema` with field validation in `backend/src/schemas/employee.schema.ts`.
   - Added `create` method in `EmployeeRepository` with automatic employee code incrementation (`EMP-031+`), email generation with collision avoidance, and department validation.
   - Mounted `POST /api/employees` returning HTTP 201 in `backend/src/routes/employee.routes.ts` and `backend/src/controllers/employee.controller.ts`.
   - Connected `App.tsx` requisition form to `employeeService.createEmployee`, automatically updating active headcount and calling `refetch()`.
2. **QA-02 (Empty Chart Datasets & Zero-Record Enhancements)**:
   - Added graceful empty state rendering in `AttendanceTrendChart.tsx` when `!data || data.length === 0`.
   - Added graceful empty state rendering in `DepartmentDistributionChart.tsx` when `!data || data.length === 0`.
   - Added zero-headcount fallback in `WorkforceDonutChart.tsx` when `totalHeadcount === 0`.
3. **QA-03 (Accessibility & Keyboard Navigation)**:
   - Added `aria-label`s on view mode ToggleButtonGroups in `AttendanceTrendChart.tsx` and `DepartmentDistributionChart.tsx`.
   - Added `aria-label`s to `EmployeeTable` search TextField (`slotProps.htmlInput`), clear button, and refresh button.
   - Added `aria-label`s to Topbar search input and clear button.
   - Added `aria-label`s to Sidebar expand button and logout button.
4. **QA-04 (Security Hardening & Input Constraints)**:
   - Enforced string length bounds on all Zod schema properties (`first_name`, `last_name`, `email`, `location`, `job_title`).
   - Verified Helmet headers (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`).
   - Verified sanitized error handling in `errorHandler.ts` to ensure stack traces and internal filesystem paths are never leaked in production.
5. **QA-05 (Department Request Deduplication & Caching)**:
   - Added 60-second in-memory caching and inflight promise deduplication to `DepartmentApiService.getDepartments()`.
   - Eliminates redundant simultaneous HTTP requests from `DashboardFilters` and `EmployeeTable`.
6. **QA-06 (Automated Edge-Case Tests)**:
   - Added test cases in `backend/tests/integration/employees.test.ts` for HTTP 201 creation, missing fields rejection, invalid email rejection, and invalid department rejection.
   - Added test case in `backend/tests/unit/repositories.test.ts` for `EmployeeRepository.create`.
   - Added integration test cases in `tests/integration/e2eIntegration.test.ts` for empty search results, special wildcard characters (`%_`), non-existent ID 404 responses, and department caching deduplication.

---

## 9. Verification & Build Command Metrics

| Check | Command Executed | Result | Duration | Notes |
|---|---|---|---|---|
| **Backend Tests** | `npm run server:test` | **PASS (55/55)** | 883ms | 15 test suites covering Health, Departments, Employees, Attendance, Dashboard, Repositories, Database Schema |
| **Frontend / Integration Tests** | `npm test` | **PASS (23/23)** | 457ms | 4 test suites covering live E2E integration, DashboardService, EmployeeService, HttpClient |
| **Lint Checks** | `npm run lint` | **PASS (0 errors, 0 warnings)** | 5.8s | ESLint passed across all TypeScript files |
| **Frontend Production Build** | `npm run build` | **PASS (0 errors)** | 567ms | `tsc -b && vite build` compiled 1534 modules |
| **Backend Production Build** | `npm run server:build` | **PASS (0 errors)** | 2.1s | `tsc` compiled cleanly to `backend/dist` |

**Total Automated Tests**: 78 tests executed across backend and frontend — 100% passing.

---

## 10. Security Audit Summary

| Risk Vector | Inspection & Verification Status |
|---|---|
| **SQL Injection** | **PROTECTED**: All SQLite queries use parameterized queries (`?`). Sorting column keys are strictly validated against `ALLOWED_EMPLOYEE_SORT_FIELDS` whitelists. Wildcard characters (`%`, `_`) in search queries are safely handled as parameter values. |
| **Input Validation** | **PROTECTED**: All incoming queries and bodies are parsed and validated via Zod schemas with upper bounds on lengths, pagination boundaries (`limit <= 100`), and ISO date regex constraints. |
| **CORS & Headers** | **PROTECTED**: Helmet enables `nosniff`, `xssFilter`, `frameguard`, and CSP headers. CORS whitelist is configurable via environment variables (`CORS_ORIGIN`). |
| **Information Disclosure** | **PROTECTED**: Centralized `errorHandler` hides internal errors, stack traces, and database paths in non-development environments, emitting standardized error envelopes (`success: false, error: { code, message }`). |
| **Data Integrity** | **PROTECTED**: Foreign keys are enforced via `PRAGMA foreign_keys = ON`. Unique constraints guard against duplicate department names, employee codes, emails, and `(employee_id, attendance_date)` pairs. Transactions wrap multi-row mutations. |

---

## 11. Performance Optimization Summary

1. **Request Deduplication**: `DepartmentApiService` caches the department array for 60 seconds and shares inflight promises across concurrent consumers (`DashboardFilters` and `EmployeeTable`).
2. **Debounced Search**: Employee table search is debounced at 300ms with automatic `AbortController` cancellation for superseded requests.
3. **Database Indexing**: Comprehensive B-Tree indexes created on SQLite tables:
   - `idx_employees_dept`: `employees(department_id)`
   - `idx_employees_status`: `employees(employment_status)`
   - `idx_employees_loc`: `employees(location)`
   - `idx_employees_code`: `employees(employee_code)`
   - `idx_attendance_emp_date`: `attendance(employee_id, attendance_date)`
   - `idx_attendance_date`: `attendance(attendance_date)`
   - `idx_attendance_status`: `attendance(status)`
4. **Clean Chart Rendering**: Graceful empty-state fallbacks prevent Recharts from calculating layout coordinates on null or empty arrays.

---

## 12. Definition of Done Checklist

- [x] **Issue QA-01 resolved**: `POST /api/employees` implemented and new hire modal wired to database.
- [x] **Issue QA-02 resolved**: Empty chart states implemented and verified in `AttendanceTrendChart`, `DepartmentDistributionChart`, and `WorkforceDonutChart`.
- [x] **Issue QA-03 resolved**: Accessibility attributes and ARIA labels added across charts, table, topbar, and sidebar.
- [x] **Issue QA-04 resolved**: Zod schema bounds and dependency audit verified.
- [x] **Issue QA-05 resolved**: Department service caching and request deduplication implemented.
- [x] **Issue QA-06 resolved**: Automated edge-case tests added and passing.
- [x] **All automated tests pass**: 78 total tests (55 backend + 23 frontend/integration), 0 failures.
- [x] **Production builds succeed**: Frontend (`npm run build`) and backend (`npm run server:build`) succeed with 0 errors.
- [x] **Code style and lint checks succeed**: `npm run lint` passes with 0 warnings and 0 errors.
- [x] **Comprehensive QA report documented**: `docs/SPRINT-4-QA-PLAN.md` fully up to date.

---

## 13. Assessment & Readiness for Demonstration

**Sprint 4 Status: COMPLETE.**  
The application is robust, reliable, secure, responsive, and performant. All KPI calculations match business rules, automated test suites run deterministically against isolated memory and live databases, production builds are green, and the platform is ready for final demonstration.
