# Sprint 3: Workforce Analytics Platform — Frontend and Backend Integration Report

## 1. Executive Summary

Sprint 3 connected the Vite + React + TypeScript + Material UI frontend to the SQLite-backed Express REST API developed in Sprint 2. All mock data dependencies have been removed from the production runtime data path. The platform now displays real, database-driven metrics, dynamic charts, synchronized filters, and a server-side paginated employee directory table with search and sorting capabilities.

All existing design tokens, typography, colors, animations, responsive grid layouts, header, topbar, theme switching (light/dark mode), and sidebar navigation were preserved.

---

## 2. API Endpoints Connected

The following REST endpoints are connected and actively queried by the frontend services:

| Endpoint | HTTP Method | Frontend Service | Query / Body Parameters | Purpose |
|---|---|---|---|---|
| `/api/dashboard/summary` | `GET` | `DashboardApiService` | `department`, `location`, `date` | Powers the 5 Primary KPI Cards (Total Employees, Present Today, Absent Today, Attendance Rate, On Leave) |
| `/api/dashboard/attendance` | `GET` | `DashboardApiService` | `startDate`, `endDate`, `department`, `location` | Powers the Attendance Trend Area Chart with In-Office vs. Remote vs. Leave breakdown and Attendance Rate % |
| `/api/dashboard/distribution` | `GET` | `DashboardApiService` | None | Powers the Workforce Status Donut Chart (by employment status) and Department Distribution Chart (by department headcount) |
| `/api/employees` | `GET` | `EmployeeApiService` | `page`, `limit`, `search`, `department`, `location`, `status`, `sortBy`, `sortOrder` | Powers the Employee Directory Table with server-side pagination, debounced multi-field search, sorting, and filters |
| `/api/employees/:id` | `GET` | `EmployeeApiService` | `id` (path param) | Single employee dossier query |
| `/api/departments` | `GET` | `DepartmentApiService` | None | Dynamically populates Department dropdown filters across the dashboard and employee table |
| `/api/attendance` | `GET` | `AttendanceApiService` | `page`, `limit`, `employeeId`, `date`, `startDate`, `endDate`, `status` | Attendance records log |
| `/api/health` | `GET` | `httpClient` | None | Health check & connectivity probe |

---

## 3. Frontend Architecture & Service Layer

The frontend service layer follows the centralized service pattern established in Sprint 1, updated for Sprint 3:

```
src/
├── services/
│   ├── api/
│   │   ├── httpClient.ts       # Centralized Fetch client with timeout, AbortSignal, and typed error handling
│   │   └── apiEndpoints.ts     # Route mapping constants (/dashboard/*, /employees/*, /departments/*, etc.)
│   ├── dashboard.service.ts    # DashboardApiService: summary, attendance trends, distribution
│   ├── dashboardService.ts     # Re-export facade ensuring zero broken imports
│   ├── employees.service.ts    # EmployeeApiService: getEmployees, getEmployeeById, CRUD
│   ├── employeeService.ts      # Re-export facade
│   ├── departments.service.ts  # DepartmentApiService: getDepartments, getDepartmentById
│   ├── departmentService.ts    # Re-export facade
│   ├── attendance.service.ts   # AttendanceApiService: getAttendanceRecords, logAttendance
│   └── attendanceService.ts    # Re-export facade
├── hooks/
│   ├── useDashboardData.ts     # Live asynchronous data orchestration hook with race-condition prevention
│   └── index.ts
├── features/
│   └── employees/
│       ├── EmployeeTable.tsx   # Material UI Employee Table with server-side pagination, search, sorting
│       └── index.ts
├── components/
│   ├── KpiCard.tsx             # 5 KPI cards with loading skeletons and optional trend delta guards
│   ├── AttendanceTrendChart.tsx # Stacked area presence chart (In-Office, Remote, Leave, Rate)
│   ├── WorkforceDonutChart.tsx # Donut chart with live headcount center label and status chips
│   ├── DepartmentDistributionChart.tsx # Bar chart with live SQLite department counts
│   ├── DashboardFilters.tsx    # Multi-dimensional filters (dynamic departments, locations, date ranges)
│   └── RecentActivity.tsx      # Live recent employee onboarding activity
└── types/
    ├── api.ts                  # Typed API contracts, Backend summary/distribution models, pagination
    └── dashboard.ts            # KpiMetric, AttendanceDataPoint, DepartmentMetric, DistributionSegment
```

---

## 4. Feature-by-Feature Integration Details

### 4.1. Five Primary KPI Cards (`KpiCard.tsx`)
- Connected to `GET /api/dashboard/summary`.
- Cards:
  1. **Total Employees**: Displays total active workforce headcount.
  2. **Present Today**: Active employees recorded with `Present` status on the effective date.
  3. **Absent Today**: Active employees with unexcused or missing check-in on the effective date (`isPositive: false`).
  4. **Attendance Rate**: `(present / totalRecorded) * 100` formatted with one decimal place.
  5. **On Leave**: Active employees on approved leave on the effective date.
- **Trend Delta Integrity**: `change` is `undefined` because the backend does not provide historical period comparison values. The trend arrow is cleanly hidden, preventing misleading or invented deltas.
- **Loading & Error Handling**: Renders Material UI `Skeleton` during data loading.

### 4.2. Attendance Trend Chart (`AttendanceTrendChart.tsx`)
- Connected to `GET /api/dashboard/attendance`.
- Grouped by `attendance_date` with real SQL aggregations:
  - `inOffice`: Present employees with in-office hubs.
  - `remote`: Present employees with location `'Remote Global'`.
  - `onLeave`: Employees on approved leave.
  - `attendanceRate`: Computed percentage for each recorded day.
- View toggle between **Headcount breakdown** (stacked areas) and **Rate %** view.
- Date range dynamically calculated from the active `timeRange` filter (`7d`, `30d`, `90d`, `1y`).

### 4.3. Workforce Status Donut Chart (`WorkforceDonutChart.tsx`)
- Connected to `GET /api/dashboard/distribution`.
- Status distribution mapped from `byStatus`:
  - `Active`: `#10B981` (Green)
  - `On Leave`: `#F59E0B` (Amber)
  - `Terminated`: `#EF4444` (Red)
- Center donut label displays true `totalEmployees` from SQLite.

### 4.4. Department Distribution Chart (`DepartmentDistributionChart.tsx`)
- Connected to `GET /api/dashboard/distribution`.
- Renders headcount for all 6 departments: Engineering, Product & Design, Sales & Marketing, Customer Success, Human Resources, and Finance & Legal.
- Bar click and Chip filter actions allow instant filtering by department.

### 4.5. Functional Dashboard Filters (`DashboardFilters.tsx`)
- **Department**: Dynamically fetched on mount from `GET /api/departments`.
- **Location**: Includes all valid hubs (`San Francisco HQ`, `London Tech Hub`, `Singapore Office`, `Remote Global`).
- **Employment Status**: Filters by contract type and status.
- **Time Range**: `7D`, `30D`, `90D`, `1Y` pills with date validation.
- **Race Condition Prevention**: `useDashboardData` instantiates an `AbortController` before each request suite, aborting in-flight queries when filters change rapidly so stale responses cannot overwrite newer results.
- **Reset Button**: Displays active filter count and resets all filters to default state.

### 4.6. Employee Directory & Data Table (`EmployeeTable.tsx`)
- Connected to `GET /api/employees`.
- Located under the **Employees** sidebar tab (`activeTab === 'directory'`).
- **Server-Side Pagination**: `page` (0-indexed for MUI, 1-indexed for backend) and `rowsPerPage` (`5`, `10`, `25`), displaying `totalRecords`.
- **Search**: Debounced input (300ms) searching across `first_name`, `last_name`, `employee_code`, and `email`. Resets page to 0.
- **Sorting**: Clickable header sort labels (`first_name`, `employee_code`, `job_title`, `department_name`, `location`, `employment_status`, `hire_date`) with `asc`/`desc` indicators.
- **Multi-Field Filtering**: Integrated department, location, and status selects.
- **States**: Skeleton rows while loading, empty state message when no records match, retry button on network error.

---

## 5. Elimination of Mock Data from Production

1. **Production Components**:
   - `App.tsx`: Removed mock data imports (`DEPARTMENTS`, `LOCATIONS`, `EMPLOYMENT_TYPES`).
   - `DashboardFilters.tsx`: Removed mock imports; fetches departments dynamically from API.
   - `AttendanceTrendChart.tsx`: Removed mock imports; uses types from `src/types`.
   - `WorkforceDonutChart.tsx`: Removed mock imports; uses types from `src/types`.
   - `DepartmentDistributionChart.tsx`: Removed mock imports; uses types from `src/types`.
   - `RecentActivity.tsx`: Removed mock imports; driven by real employee records from `employeeService.getEmployees`.
   - `useDashboardData.ts`: Queries live backend API instead of `getFilteredWorkforceData`.
2. **Mock Fallback Prevention**:
   - `DashboardApiService` does not silently fall back to `mockData.ts` on network errors.
   - When the backend is unreachable, the dashboard surfaces a clear `ErrorState` with a **Retry** action.

---

## 6. Environment & Running Instructions

### Environment Configuration
The frontend reads the backend URL from `VITE_API_BASE_URL`.
In development, it defaults to:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Commands to Run Applications Locally

1. **Start the Express REST Backend (Port 3000)**:
   ```bash
   npm run server
   # Or directly from backend folder:
   cd backend && npm run dev
   ```

2. **Start the Vite Frontend (Port 5173)**:
   ```bash
   npm run dev
   ```

3. **Run All Automated Tests**:
   - **Frontend & Integration Tests** (18 tests):
     ```bash
     npm test
     ```
   - **Backend Integration & Unit Tests** (50 tests):
     ```bash
     npm run server:test
     ```

4. **Production Build & Type Check**:
   ```bash
   npm run build
   ```

5. **Code Style & ESLint**:
   ```bash
   npm run lint
   ```

---

## 7. Automated Test Results

### 7.1. Frontend Integration & Unit Tests (`npm test`)
```
▶ Live End-to-End Frontend-Backend Integration Tests
  ✔ should fetch real KPI summary from running backend (72.56ms)
  ✔ should filter summary KPIs by department on the backend (10.21ms)
  ✔ should fetch real date-grouped attendance trends with inOffice and remote breakdown (10.99ms)
  ✔ should fetch real workforce distribution from backend SQL aggregation (3.54ms)
  ✔ should fetch all 6 departments from GET /api/departments (9.93ms)
  ✔ should perform server-side employee search, filter, sort, and pagination (46.83ms)
  ✔ should fetch paginated attendance records from GET /api/attendance (5.79ms)
✔ Live End-to-End Frontend-Backend Integration Tests (161.76ms)
▶ Dashboard Service & Transform Unit Tests
  ✔ should calculate accurate date ranges (2.65ms)
  ✔ should transform backend summary into the 5 required KPI cards (22.77ms)
  ✔ should handle zero and empty database state gracefully for KPIs (0.23ms)
  ✔ should transform attendance trends preserving inOffice and remote breakdown (0.24ms)
  ✔ should transform workforce distribution into department and status models (0.27ms)
✔ Dashboard Service & Transform Unit Tests (27.99ms)
▶ Employee Service Unit Tests
  ✔ should format query parameters and strip All-placeholders (2.04ms)
  ✔ should fetch single employee by id (0.41ms)
✔ Employee Service Unit Tests (3.74ms)
▶ HttpClient Unit Tests
  ✔ should initialize with custom or default baseUrl (1.01ms)
  ✔ should handle successful GET requests using mock fetch (1.13ms)
  ✔ should throw HttpClientError with status and code when response is not ok (0.54ms)
  ✔ should handle request abort / cancellation (0.43ms)
✔ HttpClient Unit Tests (5.99ms)
ℹ tests 18
ℹ suites 4
ℹ pass 18
ℹ fail 0
ℹ duration_ms 522.05ms
```

### 7.2. Backend Integration & Unit Tests (`npm run server:test`)
```
ℹ tests 50
ℹ suites 14
ℹ pass 50
ℹ fail 0
ℹ duration_ms 1016.18ms
```

### 7.3. Production Build & Lint
- `npm run build`: Exit Code 0, built in 530ms.
- `npm run lint`: Exit Code 0, 0 errors, 0 warnings.

---

## 8. Definition of Done Checklist

| Item | Status | Verification Detail |
|---|---|---|
| Existing dashboard UI preserved | **Done** | Preserved colors, typography, theme toggles, sidebar, headers, and card layouts |
| KPI cards use real backend data | **Done** | Connected to `/api/dashboard/summary`, zero fake trends or comparisons |
| All existing dashboard charts use API responses | **Done** | Attendance trend, status donut, and department distribution all load from SQLite |
| Employee records load from SQLite API | **Done** | Connected to `/api/employees` |
| Search, sorting, pagination, and filters work | **Done** | Server-side execution in `EmployeeTable.tsx` |
| Loading, error, and empty states implemented | **Done** | Skeletons, empty states, and section-level error alerts |
| Mock data removed from production path | **Done** | 0 references to `mockData` in production components |
| Frontend and backend work together locally | **Done** | Verified with live dev servers and HTTP requests |
| Automated tests and production builds pass | **Done** | 18 frontend tests + 50 backend tests pass (68 total); lint & build exit code 0 |
| Documentation created | **Done** | Complete report in `docs/SPRINT-3-INTEGRATION.md` |
