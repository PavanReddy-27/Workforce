/**
 * Centralized API Endpoint Definitions
 * Maps frontend service calls to the future backend REST routes.
 */

export const API_ENDPOINTS = {
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
    ATTENDANCE_TRENDS: '/dashboard/attendance-trends',
    WORKFORCE_DISTRIBUTION: '/dashboard/workforce-distribution',
    DEPARTMENT_METRICS: '/dashboard/departments',
    RECENT_ACTIVITIES: '/dashboard/recent-activities',
  },
  EMPLOYEES: {
    BASE: '/employees',
    BY_ID: (id: string) => `/employees/${encodeURIComponent(id)}`,
    SEARCH: '/employees/search',
  },
  DEPARTMENTS: {
    BASE: '/departments',
    BY_ID: (id: string) => `/departments/${encodeURIComponent(id)}`,
  },
  ATTENDANCE: {
    BASE: '/attendance',
    SUMMARY: '/attendance/summary',
    LOG: '/attendance/log',
  },
} as const;
