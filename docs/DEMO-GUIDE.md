# Workforce Analytics Platform — Demonstration & Evaluator Guide

This document provides a structured, 5–10 minute demonstration sequence for evaluators, stakeholders, and reviewers testing the **Workforce Analytics Platform**.

---

## 1. Quick Launch Setup

Open two terminal windows in the project root (`c:\work\Workforce dashboard\Workforce`):

### Terminal 1: Start SQLite REST API Backend
```powershell
# Installs backend dependencies if needed and boots server on port 3000
npm run server
```
*Expected log output*:
```text
[INFO] SQLite Database initialized at ./data/workforce.db
[INFO] Server running in development mode on port 3000
[INFO] REST API available at http://localhost:3000/api
```

### Terminal 2: Start React Frontend
```powershell
# Launches Vite development server on port 5173
npm run dev
```
*Expected output*:
```text
  VITE v8.3.5  ready in 180 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Now open your web browser to: **`http://localhost:5173`**

---

## 2. Step-by-Step 5–10 Minute Demo Walkthrough

### Step 1: Dashboard Overview & Theme Toggle (1 Minute)
1. **Initial Impression**: Observe the Slate-Blue enterprise aesthetic, typography hierarchy (Inter font), tabular figures, and card elevations.
2. **Theme Switcher**: Click the Moon/Sun icon in the top header.
   - Observe instantaneous transition from Light Mode (`#F8FAFC` background) to Dark Mode (`#0F172A` background).
   - Notice that cards, charts, dividers, and SVG axes adapt smoothly without flicker.

### Step 2: The Five Primary KPI Cards (1 Minute)
Examine the top row of metrics:
- **Total Employees**: Displays total active staff (`28` active).
- **Present Today**: Displays staff checked in today (`27`).
- **Absent Today**: Staff marked absent (`1`).
- **Attendance Rate**: Evaluated presence percentage (`96.4%`).
- **On Leave**: Staff on approved leave (`0`).
*Talking Point*: Point out that these values are dynamically queried via `GET /api/dashboard/summary` from SQLite, and unrecorded employees are not falsely counted as absent.

### Step 3: Interactive Visualizations (2 Minutes)
1. **Attendance Trend Chart**:
   - Area chart showing daily staff distribution: In-Office (blue), Remote (sky blue), and Approved Leave (amber).
   - Toggle the view button in the chart header from **Headcount** to **Rate %** to view percentage velocity over time.
2. **Workforce Status Donut Chart**:
   - Displays contract status: Full-Time, Contractor, Part-Time, and Intern.
   - The donut center shows the total headcount.
3. **Department Distribution Chart**:
   - Bar chart showing current staff count and open requisitions per business unit.
   - Toggle view mode from **Headcount & Roles** to **Satisfaction** to see eNPS scores.
   - **Interactive Filtering**: Click the **Engineering** bar. Notice that the entire dashboard instantly updates all KPIs and charts to isolate Engineering metrics! Click the chip to clear.

### Step 4: Multi-Dimensional Filter Bar (1 Minute)
1. In the filter bar below the KPI cards, click the **Department** dropdown and select **Customer Success**.
2. Notice the KPI cards update to reflect Customer Success metrics immediately.
3. Click the **Reset Filters** button to return to the organizational baseline.

### Step 5: Employee Directory Data Table (2 Minutes)
Scroll down to the **Employee Directory** table:
1. **Debounced Search**:
   - Type `"Sarah"` into the search box.
   - Notice that after a 300ms debounce, the table displays Sarah Jenkins.
   - Click the `X` clear icon to restore all records.
2. **Multi-Field Filters**:
   - Select **Location** -> `"London Tech Hub"`.
   - The table displays only employees based in London.
3. **Bidirectional Sorting**:
   - Click the **Last Name** column header to sort ascending, then click again to sort descending.
4. **Server-Side Pagination**:
   - Switch rows-per-page from `10` to `5`, and click the next page arrow (`>`). Observe fast server pagination without client-side lag.

### Step 6: Live Employee Onboarding (1 Minute)
1. In the topbar header, click the **+ Add Employee** button.
2. Fill out the dialog:
   - Name: `Alexander Wright`
   - Department: `Engineering`
   - Role: `Senior Cloud Architect`
   - Location: `San Francisco HQ`
3. Click **Initiate Onboarding**.
4. Observe the confirmation snackbar, the employee table updating with Alexander Wright, and the KPI card total headcount incrementing!

---

## 3. Sample REST API Verification Commands

You can verify the backend independently using any terminal:

### 1. Health Check
```powershell
curl.exe -s http://localhost:3000/api/health
```

### 2. Fetch Summary KPIs
```powershell
curl.exe -s "http://localhost:3000/api/dashboard/summary"
```

### 3. Fetch Summary KPIs Filtered by Department
```powershell
curl.exe -s "http://localhost:3000/api/dashboard/summary?department=Engineering"
```

### 4. Search Employees with Pagination
```powershell
curl.exe -s "http://localhost:3000/api/employees?search=Sarah&page=1&limit=5"
```

### 5. Fetch All 6 Departments
```powershell
curl.exe -s http://localhost:3000/api/departments
```

---

## 4. Manual Screenshot Evidence Capture Guide

Because headless browser automation drivers (Playwright) require internet downloads that are blocked by offline sandboxes, follow these steps to capture genuine demonstration screenshots:

1. **Desktop Dashboard Overview**:
   - Browser URL: `http://localhost:5173`
   - Viewport: 1920x1080 (or full screen)
   - Save to: `docs/screenshots/01-dashboard-desktop.png`
2. **Filtered View (Engineering isolated)**:
   - Click **Department** filter -> Select **Engineering**.
   - Save to: `docs/screenshots/02-filtered-dashboard.png`
3. **Employee Directory Search & Pagination**:
   - Scroll to Employee Table.
   - Type `"Sarah"` into search input.
   - Save to: `docs/screenshots/03-employee-table-search.png`
4. **Dark Mode Presentation**:
   - Click the Moon icon in the topbar to toggle Dark Mode.
   - Save to: `docs/screenshots/04-dark-theme.png`
5. **New Hire Requisition Dialog**:
   - Click **Add Employee** button.
   - Save to: `docs/screenshots/05-add-employee-modal.png`
