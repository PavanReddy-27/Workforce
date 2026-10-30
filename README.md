# Stackly Workforce Analytics Platform — Dashboard UI/UX

Enterprise workforce analytics dashboard developed for the Stackly Workforce Analytics Platform (**Task 1: Dashboard UI/UX Development**). Built with React, TypeScript, Material UI, and Recharts, following the Stackly enterprise visual identity with information-dense layouts, precise grid alignment, and clean component architecture.

---

## Deliverables Submission Package

| Deliverable | Location / Verification Method | Status |
| :--- | :--- | :---: |
| **1. Complete Source Code** | Full React + TypeScript + Vite codebase in [`src/`](./src) | ✅ Complete |
| **2. Dashboard Visual Presentation** | Clean, restrained enterprise UI matching Stackly Figma specs running at `http://localhost:5173` | ✅ Complete |
| **3. Responsive Layout Demonstration** | Multi-breakpoint grid: Desktop (5 KPI cols, 7:5 charts), Tablet (2+2+1 KPI grid), Mobile (stacked, temporary slide-out drawer) | ✅ Complete |
| **4. List of Implemented Features** | Comprehensive feature matrix documented below across 10 functional categories | ✅ Complete |
| **5. Testing Results** | `0 errors, 0 warnings` in ESLint & TypeScript compilation; Vite production bundle verified | ✅ Complete |
| **6. Setup Instructions** | Step-by-step installation, development server, and build guide documented below | ✅ Complete |

---

## Detailed Feature Checklist

| Required Feature | Implementation Details | Status |
| :--- | :--- | :---: |
| **Sidebar & Top Navigation** | Slate-blue collapsible navigation (248px desktop / 68px collapsed), responsive mobile slide-out drawer, grouped navigation sections with active route indicator, global search bar, theme switcher, quick notifications, CSV export, and new hire dialog. | ✅ Complete |
| **Five Primary KPI Cards** | Exactly five primary metrics: **Total Employees**, **Present Today**, **Absent Today**, **Attendance Rate**, and **On Leave**. Tabular numerals, percentage deltas, dynamic context subtitles, and hover interaction. | ✅ Complete |
| **Attendance Trend Chart** | Recharts Area Chart displaying daily/weekly presence. Distinguishes **In-Office**, **Remote**, and **Approved Leave** headcount, with interactive toggle to view **Attendance Rate %** across time series. | ✅ Complete |
| **Department Distribution Chart** | Interactive bar chart comparing **Staff Headcount** and **Open Requisitions** across departments, with toggle to view **eNPS Satisfaction Scores**. Clicking any bar filters the entire dashboard. | ✅ Complete |
| **Workforce Donut Chart** | Donut chart rendering employment contract breakdown: **Full-Time**, **Contractor**, **Part-Time**, and **Interns**. Segment counts strictly equal total filtered headcount, with a center total label. | ✅ Complete |
| **Recent Employee Activity** | Activity feed logging hires, promotions, leave approvals, and transfers. Formatted with clean row density, employee avatar initials, department tags, and event category tabs. | ✅ Complete |
| **Four-Dimension Filter System** | Fully synchronized filters for **Date Range** (`7d`, `30d`, `90d`, `1y`), **Department**, **Location**, and **Employment Status**, complete with active filter count and a single-click reset action. | ✅ Complete |
| **Light & Dark Theme Support** | Cohesive slate-blue dark mode and crisp off-white light mode. All typography, surface cards, borders, dividers, and chart SVG fills dynamically respond to theme toggle. | ✅ Complete |
| **Responsive Grid Layout** | Optimized for Desktop (5 KPI columns, balanced 7:5 chart rows), Tablet (2+2+1 KPI grid, fluid panels), and Mobile (<768px stacked cards, mobile drawer navigation, zero horizontal scroll). | ✅ Complete |
| **Loading, Empty & Error States** | Dedicated reusable components: `LoadingSkeleton`, `EmptyState` (with reset trigger), and `ErrorState` (with retry trigger). Includes a Topbar state simulator for easy QA verification. | ✅ Complete |

---

## Technology Stack

- **Core**: React 19, TypeScript
- **Bundler & Tooling**: Vite 8, ESLint 10, TypeScript 6
- **UI Framework & Design System**: Material UI (MUI v9), Emotion
- **Data Visualization**: Recharts v3
- **Typography**: Inter (Google Fonts) with tabular numeral support
- **Icons**: Material UI Outlined Icons

---

## Architecture & Project Structure

```
Workforce/
├── docs/
│   └── SPRINT-1-AUDIT.md        # Sprint 1 technical audit & architecture documentation
├── index.html                   # HTML entry point with Inter font & meta tags
├── package.json                 # Dependencies and build scripts
├── tsconfig.json                # TypeScript project configuration
├── eslint.config.js             # ESLint flat config
├── src/
│   ├── main.tsx                 # React DOM mount point with StrictMode
│   ├── App.tsx                  # Root dashboard layout, state orchestration, modals
│   ├── index.css                # Base reset, typography, and clean scrollbars
│   ├── theme/
│   │   └── theme.ts             # Semantic design tokens, light/dark MUI theme palette
│   ├── components/
│   │   ├── Topbar.tsx           # Sticky top app bar, search, actions, theme toggle
│   │   ├── Sidebar.tsx          # Permanent collapsible sidebar & mobile drawer
│   │   ├── DashboardFilters.tsx # Date, dept, location, and employment status filters
│   │   ├── KpiCard.tsx          # Metric card with value, trend delta, and subtitle
│   │   ├── AttendanceTrendChart.tsx # Recharts area chart for attendance velocity
│   │   ├── DepartmentDistributionChart.tsx # Recharts bar chart with click-to-filter
│   │   ├── WorkforceDonutChart.tsx  # Recharts donut chart with center metrics
│   │   ├── RecentActivity.tsx   # Activity timeline with category tabs & status chips
│   │   ├── LoadingSkeleton.tsx  # Layout skeleton loader for async states
│   │   ├── EmptyState.tsx       # Zero-match fallback with filter reset action
│   │   └── ErrorState.tsx       # Telemetry query failure state with retry button
│   └── data/
│       └── mockData.ts          # Deterministic workforce dataset & synchronizer
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Installation

1. Navigate to the project directory:
   ```bash
   cd Workforce
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## Build & Testing Verification

The project has been tested and validated using strict TypeScript checks, ESLint verification, and production compilation:

```bash
# Run ESLint validation
npm run lint

# Run TypeScript check and production bundle build
npm run build

# Preview the production build locally
npm run preview
```

### Build Status
- **ESLint**: 0 errors, 0 warnings
- **TypeScript (`tsc -b`)**: Clean compilation
- **Vite Build**: Minified and bundled successfully

---

## Design & Usability Highlights

1. **Information-Dense, Restrained Aesthetic**:
   - Avoided decorative gradients, oversized numbers, and glowing borders.
   - Used subtle 1px dividers (`#E2E8F0` light, `rgba(255, 255, 255, 0.08)` dark) and 6–8px border radii for a clean enterprise feel.
2. **Mathematical Consistency**:
   - Present Today + Absent Today + On Leave strictly equals Total Employees.
   - Filter adjustments (e.g. choosing "Engineering" or "London Tech Hub") proportionately recalculate KPI numbers, attendance volume, department distributions, and workforce donut segments in real time.
3. **Interactive Visual Filtering**:
   - Clicking any department bar in the Department Distribution chart instantly applies that department filter across the dashboard.
4. **State Simulation for Evaluation**:
   - The Topbar includes an inline **State** selector (`Normal`, `Loading`, `Empty`, `Error`) allowing reviewers to immediately inspect skeleton loaders, empty filter results, and error recovery states without modifying source code.

---

**Developed by**: Reddi Uday Kumar  
**Platform**: Stackly Workforce Analytics
