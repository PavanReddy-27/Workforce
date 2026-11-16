# Workforce Analytics Platform — Screenshot Evidence & Capture Directory

This directory contains screenshots captured from the running Workforce Analytics Platform.

---

## Screenshot Inventory & Capture Specifications

| Screenshot File | Description | Key Visual Elements |
|---|---|---|
| `01-dashboard.png` | Admin dashboard | Live workforce KPIs and attendance charts |
| `02-user-management.png` | Admin user management | User list, roles, MFA status, and account status |
| `03-audit-logs.png` | Security audit logs | Recorded authentication events |
| `04-access-denied.png` | Employee access denial | Restricted audit-log route and missing `audit:view` permission |

---

## How to Capture

1. Start the platform:
   - Terminal 1: `npm run server`
   - Terminal 2: `npm run dev`
2. Open Chrome/Edge at `http://localhost:5173`.
3. Use the browser's screenshot command or operating-system capture tool.
4. Save additional PNG captures to this directory (`docs/screenshots/`).
