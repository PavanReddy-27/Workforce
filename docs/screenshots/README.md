# Workforce Analytics Platform — Screenshot Evidence & Capture Directory

This directory stores genuine application screenshots demonstrating the running Workforce Analytics Platform.

---

## Screenshot Inventory & Capture Specifications

| Screenshot File | Description | Target Viewport | Key Visual Elements |
|---|---|---|---|
| `01-dashboard-desktop.png` | Main Dashboard Overview | 1920x1080 Desktop | 5 KPI cards with live metrics, Attendance Trend Chart, Workforce Donut Chart, and Topbar. |
| `02-dashboard-filtered.png` | Filtered Analytics View | 1920x1080 Desktop | Department filter set to "Engineering", isolated KPI metrics, highlighted chart bars. |
| `03-employee-table.png` | Employee Directory Table | 1920x1080 Desktop | Search box filtering for "Sarah", department chip badges, pagination controls. |
| `04-dark-mode.png` | Slate-Blue Dark Theme | 1920x1080 Desktop | Night mode palette (`#0F172A` background, `#1E293B` cards), dynamic chart contrast. |
| `05-add-employee.png` | Onboarding Dialog Modal | 1920x1080 Desktop | "Initiate New Hire Requisition" dialog filled with form inputs. |

---

## How to Capture

1. Start the platform:
   - Terminal 1: `npm run server`
   - Terminal 2: `npm run dev`
2. Open Chrome/Edge at `http://localhost:5173`.
3. Press `F12` -> Open Developer Tools -> Press `Ctrl+Shift+P` -> Type `"Capture full size screenshot"`.
4. Save the captured PNG files to this directory (`docs/screenshots/`).
