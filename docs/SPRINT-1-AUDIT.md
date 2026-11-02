# Sprint 1: Workforce Analytics Platform — Project Audit, Architecture & Setup

**Document Version**: 1.0.0  
**Date**: October 30, 2026  
**Auditor**: Senior Full-Stack Engineer & Software Architect  
**Project Workspace**: `c:\work\Workforce dashboard\Workforce`  
**Git Branch**: `feature/task-2-foundation`  
**Base Commit**: `842afd7 Initial commit: Stackly Workforce Analytics Platform Dashboard UI/UX`  

---

## 1. Executive Summary

During Sprint 1, we performed an in-depth technical audit of the **Stackly Workforce Analytics Platform** (Task 1 Dashboard UI/UX). The Task 1 implementation is exceptionally well constructed, visually aligned with the Stackly enterprise design system, and feature-complete on the frontend.

Sprint 1 objectives achieved:
- Preserved 100% of the existing Task 1 UI, layout, interactions, and visual styling.
- Isolated development on a dedicated Git branch: `feature/task-2-foundation`.
- Established clean architectural layers (`types/`, `services/`, `utils/`, `hooks/`, `features/`, `components/`) without introducing breaking changes or unnecessary dependencies.
- Extracted strict TypeScript interfaces and domain models for employees, departments, attendance records, dashboard KPIs, and API response/error envelopes.
- Configured environment-based API resolution (`VITE_API_BASE_URL`) with `.env.example` and protected Git from leaking local `.env` files.
- Verified TypeScript compilation (`tsc -b`), production Vite bundling, and ESLint with **0 errors and 0 warnings**.

---

## 2. Project Structure & Directory Layout

### Current Physical Structure

```
c:\work\Workforce dashboard\Workforce/
├── .env.example                         # Environment configuration template
├── .git/                                # Git version control
├── .gitignore                           # Git ignore rules (updated for .env)
├── dist/                                # Production build distribution output
├── docs/
│   └── SPRINT-1-AUDIT.md                # This audit and architectural documentation
├── eslint.config.js                     # ESLint 10 flat configuration
├── index.html                           # HTML entry point with Inter font & viewport meta
├── node_modules/                        # Installed npm packages
├── package.json                         # Project dependencies and script declarations
├── package-lock.json                    # Deterministic lockfile
├── public/                              # Static public assets (stackly-logo.png)
├── src/
│   ├── main.tsx                         # React 19 application entry with StrictMode
│   ├── App.tsx                          # Root layout, theme provider, and state orchestration
│   ├── index.css                        # CSS reset, typography rules, custom scrollbars
│   ├── theme/
│   │   └── theme.ts                     # Semantic design tokens and MUI theme (light/dark)
│   ├── types/                           # [Sprint 1] Strict TypeScript domain & API interfaces
│   │   ├── models.ts                    # Employee, Department, AttendanceRecord, Activity
│   │   ├── dashboard.ts                 # FilterState, KpiMetric, AttendanceDataPoint, etc.
│   │   ├── api.ts                       # ApiResponse<T>, PaginatedResponse<T>, ApiError
│   │   └── index.ts                     # Consolidated types barrel
│   ├── services/                        # [Sprint 1] API client and service layer
│   │   ├── api/
│   │   │   ├── httpClient.ts            # Configurable fetch client with typed error handling
│   │   │   └── apiEndpoints.ts          # Centralized REST route definitions
│   │   ├── dashboardService.ts          # IDashboardService (dual Mock & API implementations)
│   │   ├── employeeService.ts           # IEmployeeService interface & REST client
│   │   ├── departmentService.ts         # IDepartmentService interface & REST client
│   │   ├── attendanceService.ts         # IAttendanceService interface & REST client
│   │   └── index.ts                     # Consolidated services barrel
│   ├── hooks/                           # [Sprint 1] Reusable state & data hooks
│   │   ├── useDashboardData.ts          # Decouples dashboard calculations from UI
│   │   └── index.ts                     # Consolidated hooks barrel
│   ├── utils/                           # [Sprint 1] Calculation and formatting helpers
│   │   ├── formatters.ts                # formatNumber, formatPercentage, formatDate, initials
│   │   ├── calculations.ts              # calculateAttendanceRate, segment percentages
│   │   └── index.ts                     # Consolidated utils barrel
│   ├── components/                      # Presentation components
│   │   ├── Topbar.tsx                   # Top navigation bar, search, export, theme toggle
│   │   ├── Sidebar.tsx                  # Collapsible navigation drawer
│   │   ├── DashboardFilters.tsx         # Dept, location, employment-type, time-range filters
│   │   ├── KpiCard.tsx                  # Single KPI metric card with trends
│   │   ├── AttendanceTrendChart.tsx     # Recharts area chart for attendance velocity
│   │   ├── DepartmentDistributionChart.tsx # Recharts bar chart with click-to-filter
│   │   ├── WorkforceDonutChart.tsx      # Recharts donut chart with centered headcount
│   │   ├── RecentActivity.tsx           # Activity audit log with category tabs
│   │   ├── LoadingSkeleton.tsx          # Card and chart skeleton loader
│   │   ├── EmptyState.tsx               # No-results state with filter reset action
│   │   ├── ErrorState.tsx               # Service failure state with retry trigger
│   │   ├── layout/                      # [Sprint 1] Layout components boundary
│   │   ├── common/                      # [Sprint 1] Common state display boundary
│   │   └── charts/                      # [Sprint 1] Chart visualization boundary
│   ├── features/                        # [Sprint 1] Domain feature boundaries
│   │   ├── dashboard/                   # Dashboard feature module
│   │   ├── employees/                   # Employee management boundary (Sprint 2/3)
│   │   ├── attendance/                  # Attendance telemetry boundary (Sprint 2/3)
│   │   └── departments/                 # Department details boundary (Sprint 2/3)
│   └── data/
│       └── mockData.ts                  # Deterministic mock dataset & calculation engine
├── tsconfig.app.json                    # Application TypeScript compiler options
├── tsconfig.json                        # Root TypeScript references
├── tsconfig.node.json                   # Node/Vite TypeScript compiler options
└── vite.config.ts                       # Vite 8 build and plugin configuration
```

---

## 3. Technology Stack & Versions

| Package / Technology | Installed Version | Role |
| :--- | :--- | :--- |
| **Node.js** | `v24.19.0` | Server runtime environment |
| **npm** | `11.17.0` | Package manager |
| **React** | `19.3.1` | Core UI library |
| **React DOM** | `19.3.1` | DOM renderer for React |
| **Vite** | `8.3.5` (cli `8.3.4`) | High-performance build tool and dev server |
| **TypeScript** | `6.0.3` | Type system and static analysis |
| **Material UI (MUI)** | `9.5.0` | Enterprise design system and UI components |
| **MUI Icons** | `9.5.0` | Outlined icon set |
| **Emotion React & Styled**| `11.14.0` / `11.14.1` | CSS-in-JS styling engine |
| **Recharts** | `3.10.1` | Declarative SVG charting library |
| **ESLint** | `10.13.0` | Code quality linter |
| **typescript-eslint** | `8.71.2` | TypeScript parser and rules for ESLint |

---

## 4. Features That Already Work (Task 1 Verified)

1. **Sidebar Navigation**:
   - Collapsible desktop drawer (248px expanded, 68px collapsed) with icon-only tooltip mode.
   - Responsive mobile overlay drawer triggered via topbar hamburger icon.
   - Categorized navigation groups (`Overview`, `Employees`, `Attendance`, `Departments`, `Recruitment`, `Performance`, `Payroll`, `Settings`).
   - Profile footer with avatar, name, and role.
2. **Topbar Header**:
   - Sticky header with glassmorphism backdrop blur.
   - Global employee/role search input with clear button.
   - One-click Light/Dark theme toggle.
   - Quick action triggers: CSV export feedback and "Add Employee" requisition modal.
   - State simulator dropdown (`Normal`, `Loading`, `Empty`, `Error`) for instant UI validation.
3. **Five Primary KPI Cards**:
   - `Total Employees` (1,428 baseline) with open requisition count.
   - `Present Today` (1,291 baseline) with on-site vs. remote breakdown.
   - `Absent Today` (65 baseline) with deviation tracking.
   - `Attendance Rate` (95.2% baseline) against the 92.0% target.
   - `On Leave` (72 baseline) with approved PTO context.
   - Strict mathematical consistency: $\text{Total} = \text{Present} + \text{Absent} + \text{On Leave}$.
4. **Attendance Trend Chart**:
   - Recharts Area Chart displaying presence across time ranges (`7d`, `30d`, `90d`, `1y`).
   - Dual view modes: Headcount breakdown (In-Office vs. Remote vs. Leave) and Attendance Rate percentage curve.
   - Custom styled tooltip showing headcount percentages.
   - Cycle total summary footer with live calculated averages.
5. **Department Distribution Chart**:
   - Recharts Bar Chart comparing headcount and open requisitions per department.
   - Interactive toggle to display eNPS employee satisfaction scores (0–100).
   - Interactive click-to-filter: Clicking any department bar isolates the entire dashboard to that department.
6. **Workforce Status Donut Chart**:
   - Donut chart depicting employment contract breakdown (Full-Time, Contractor, Part-Time, Intern).
   - Centered total employee counter with tabular numerals.
   - Detailed segment rows with colored dot indicators and percentage badges.
7. **Recent Employee Activity Feed**:
   - Personnel movements timeline (hires, promotions, transfers, leaves, anniversaries).
   - Category filtering tabs (`All Events`, `Hires`, `Promotions`, `Leaves`).
   - Initials avatars and color-coded status chips.
8. **Multi-Dimension Filter System**:
   - Synchronized filters for Department, Location, Employment Status, and Date Range pills.
   - Active filter count indicator and single-click reset button.
   - Live matching staff counter.
9. **Light & Dark Theme Controls**:
   - Comprehensive MUI theme toggle switching between `#F1F5F9` light background and `#0F172A` / `#1E293B` slate-blue dark background.
   - Synchronized card borders, typography colors, dividers, and chart gradients.
10. **State Management & Async Simulation**:
    - `LoadingSkeleton`: Clean layout placeholder for KPI cards, charts, and activity rows.
    - `EmptyState`: Zero-match fallback with filter reset trigger.
    - `ErrorState`: Telemetry query failure state with retry trigger.

---

## 5. Identified Gaps, Bugs & Architectural Debt

| Issue | Severity | Impact | Resolution in Sprint 1 / Action Plan |
| :--- | :---: | :--- | :--- |
| **Missing Architecture Layers** | High | Flat `components/` and `data/` structure without domain boundaries. | Created `types/`, `services/`, `utils/`, `hooks/`, `features/`, and component sub-modules. |
| **Types Mixed with Mock Data** | Medium | Domain interfaces (`FilterState`, `KpiMetric`, etc.) were defined inside `mockData.ts`. | Extracted to `src/types/` and re-exported from `mockData.ts` for backward compatibility. |
| **Lack of HTTP Service Abstraction** | High | Components could only read static mock data synchronously. | Built `HttpClient`, `API_ENDPOINTS`, and `IDashboardService` with dual Mock/API implementations. |
| **Missing Environment Config** | Medium | No `.env.example` or base URL mechanism for future backend connection. | Created `.env.example` with `VITE_API_BASE_URL` and updated `.gitignore`. |
| **.gitignore Omission** | High | Local `.env` files were not ignored, risking secret leakage in Git. | Added `.env`, `.env.local`, and `.env.*.local` to `.gitignore`. |
| **README Path Inconsistency** | Low | README referenced `vite-project/` instead of actual directory `Workforce/`. | Updated run commands and documentation to reflect the true directory. |
| **Vite Bundle Chunk Size Warning** | Low | Bundle is 1,030 kB (MUI + Recharts combined in single chunk). | Non-breaking; scheduled for dynamic `import()` code-splitting in Sprint 3 optimization. |
| **Automated Test Harness Absent** | Medium | No test runner (Vitest or Jest) installed in `package.json`. | Noted for Sprint 2/3 test setup; verified through `tsc -b`, ESLint, and manual HTTP checks. |

---

## 6. Components Dependent on Mock Data

Every dashboard component currently consumes deterministic mock data calculated by `getFilteredWorkforceData()` in `src/data/mockData.ts`. The table below outlines how each component will map to real backend REST endpoints in Sprint 2/3:

| Component | Current Mock Data Dependency | Future Backend API Endpoint | Future Service Method |
| :--- | :--- | :--- | :--- |
| `KpiCard` (x5) | `kpis` array from `mockData.ts` | `GET /api/dashboard/summary` | `dashboardService.getSummary()` |
| `AttendanceTrendChart` | `trendPoints` (`AttendanceDataPoint[]`) | `GET /api/dashboard/attendance-trends` | `dashboardService.getAttendanceTrends()` |
| `DepartmentDistributionChart` | `BASE_DEPARTMENTS` (`DepartmentMetric[]`) | `GET /api/dashboard/departments` | `departmentService.getDepartments()` |
| `WorkforceDonutChart` | `workforceDonutSegments` | `GET /api/dashboard/workforce-distribution` | `dashboardService.getWorkforceDistribution()` |
| `RecentActivity` | `RAW_ACTIVITIES` (`ActivityItem[]`) | `GET /api/dashboard/recent-activities` | `dashboardService.getSummary()` |
| `DashboardFilters` | `DEPARTMENTS`, `LOCATIONS`, `EMPLOYMENT_TYPES` | `GET /api/departments`, `GET /api/employees/filter-options` | `departmentService.getDepartments()` |
| New Hire Modal (`App.tsx`) | Form state resets mock message | `POST /api/employees` | `employeeService.createEmployee()` |

---

## 7. Proposed Frontend & Backend Architecture

### High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                FRONTEND (React 19 + Vite)                         |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                            Presentation Layer                               |  |
|  |   [App.tsx] -> [Sidebar] [Topbar] [DashboardFilters]                       |  |
|  |             -> [KpiCards] [AttendanceTrendChart]                            |  |
|  |             -> [DepartmentChart] [WorkforceDonut] [RecentActivity]          |  |
|  +-----------------------------------------------------------------------------+  |
|                                       |                                           |
|  +-----------------------------------------------------------------------------+  |
|  |                       Custom Hooks & State Layer                            |  |
|  |   useDashboardData(filters)                                                 |  |
|  +-----------------------------------------------------------------------------+  |
|                                       |                                           |
|  +-----------------------------------------------------------------------------+  |
|  |                            Service Layer (src/services/)                    |  |
|  |   [dashboardService]  [employeeService]  [departmentService]  [attendanceService]  |
|  |                                       |                                        |
|  |                              [HttpClient]                                   |  |
|  |                       (Base URL: VITE_API_BASE_URL)                         |  |
|  +-----------------------------------------------------------------------------+  |
+---------------------------------------|-------------------------------------------+
                                        | HTTP REST (JSON)
+---------------------------------------v-------------------------------------------+
|                           BACKEND (Sprint 2 Target)                              |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                        Express REST API Controllers                         |  |
|  |   /api/dashboard/*   /api/employees/*   /api/departments/*   /api/attendance/* |  |
|  +-----------------------------------------------------------------------------+  |
|                                       |                                           |
|  +-----------------------------------------------------------------------------+  |
|  |                          Repository Pattern Layer                           |  |
|  |   EmployeeRepository  DepartmentRepository  AttendanceRepository           |  |
|  +-----------------------------------------------------------------------------+  |
|                                       |                                           |
|  +-----------------------------------------------------------------------------+  |
|  |                           SQLite Database (better-sqlite3)                  |  |
|  |   employees | departments | attendance_records | activity_logs             |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 8. Planned API Boundaries & Response Contracts

All REST endpoints in Sprint 2 will adhere to the standard envelope contracts defined in `src/types/api.ts`:

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation",
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

### Standard Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 1428,
    "totalPages": 72
  },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Employee with ID 'emp-999' was not found",
    "details": null
  },
  "timestamp": "2026-10-30T12:00:00.000Z"
}
```

### Planned Endpoint Endpoints Specification

1. **Dashboard Overview**:
   - `GET /api/dashboard/summary?department=&location=&timeRange=30d&employmentType=&searchQuery=`
   - Returns: `ApiResponse<DashboardSummary>` containing computed KPIs, trend points, donut segments, and recent activities.
2. **Attendance Trends**:
   - `GET /api/dashboard/attendance-trends?timeRange=30d&department=&location=`
   - Returns: `ApiResponse<AttendanceDataPoint[]>` (daily or weekly aggregated presence).
3. **Workforce Distribution**:
   - `GET /api/dashboard/workforce-distribution?department=&location=`
   - Returns: `ApiResponse<DistributionSegment[]>` (employment type breakdown).
4. **Employees**:
   - `GET /api/employees?page=1&pageSize=20&departmentId=&status=&searchQuery=`
   - `GET /api/employees/:id`
   - `POST /api/employees` (New hire onboarding)
   - `PUT /api/employees/:id`
   - `DELETE /api/employees/:id`
5. **Departments**:
   - `GET /api/departments`
   - `GET /api/departments/:id`
6. **Attendance Telemetry**:
   - `GET /api/attendance?page=1&pageSize=50&startDate=&endDate=&departmentId=`
   - `POST /api/attendance/log`

---

## 9. Environment Setup & Run Commands

### Prerequisites
- Node.js `v18+` (Tested on `v24.19.0`)
- npm `v9+` (Tested on `11.17.0`)
- Git `v2.40+`

### Setup Instructions

```bash
# 1. Navigate to the project frontend directory
cd "c:\work\Workforce dashboard\Workforce"

# 2. Check out the foundation branch
git checkout feature/task-2-foundation

# 3. Create a local environment file (optional for mock mode)
cp .env.example .env

# 4. Install dependencies (if not already installed)
npm install

# 5. Start the local development server
npm run dev
```

The application will be accessible at:
```
http://localhost:5173
```

### Build & Verification Commands

```bash
# Run ESLint quality checks
npm run lint

# Run TypeScript compilation check and production bundle build
npm run build

# Preview the production build locally
npm run preview
```

---

## 10. Tests and Build Checks Performed

| Check / Command | Execution Status | Actual Result |
| :--- | :---: | :--- |
| **`git status` & branch inspection** | Executed | Clean working tree; created branch `feature/task-2-foundation`. |
| **`node -v; npm -v`** | Executed | Node `v24.19.0`, npm `11.17.0`. |
| **`npm run build` (`tsc -b && vite build`)** | Executed | `0 errors`. 1,527 modules transformed. Production bundle built in `485ms`. |
| **`npm run lint` (`eslint .`)** | Executed | `0 errors, 0 warnings`. Clean flat config validation. |
| **HTTP Server Response Check (`curl` / `Invoke-WebRequest`)** | Executed | `HTTP 200 OK` at `http://localhost:5173/`. |
| **Browser Subagent Check** | Attempted | Playwright failed to initialize because the sandbox environment blocks external CDN downloads (`playwright.azureedge.net: 404`). Confirmed with user and verified via CLI / HTTP server check. |
| **Git Diff Inspection** | Executed | Only strictly necessary files touched (`.gitignore`, `src/App.tsx`, `src/data/mockData.ts`, plus new architecture files). Zero unintended diffs. |

---

## 11. Remaining Work for Sprint 2

In Sprint 2, the team will implement the backend service and SQLite database layer:

1. **Backend Server Setup**:
   - Initialize Express application with TypeScript in a dedicated `/server` directory or sibling package.
   - Configure middleware: `cors`, `helmet`, `express.json()`, and structured logging.
2. **SQLite Database Schema & Migrations**:
   - Install `better-sqlite3` and create database schema:
     - `departments` (id, name, code, headcount, open_roles, satisfaction, budget, diversity, color)
     - `employees` (id, first_name, last_name, email, role, department_id, location, employment_type, status, hire_date, avatar_url)
     - `attendance_records` (id, employee_id, date, check_in, check_out, status, work_mode, leave_type)
     - `activity_logs` (id, employee_id, type, description, timestamp, status)
   - Create seed script to populate SQLite with the 1,428 employee records mirroring current mock data.
3. **Repository Pattern Implementation**:
   - `DepartmentRepository` (findAll, findById)
   - `EmployeeRepository` (findAll, findById, create, update, delete, countByFilter)
   - `AttendanceRepository` (findByDateRange, getDailyAggregates, logPresence)
   - `DashboardRepository` (aggregateKpis, getTrendSeries, getDistribution)
4. **REST API Controllers**:
   - Expose endpoints matching `API_ENDPOINTS` specification.
5. **Frontend API Cutover Preparation (Sprint 3)**:
   - Switch `dashboardService` from `DashboardMockService` to `DashboardApiService` once backend verification passes.
