/**
 * Centralized API Endpoint Definitions
 * Maps frontend service calls to the future backend REST routes.
 */

export const API_ENDPOINTS = {
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
    ATTENDANCE: '/dashboard/attendance',
    ATTENDANCE_TRENDS: '/dashboard/attendance',
    DISTRIBUTION: '/dashboard/distribution',
    WORKFORCE_DISTRIBUTION: '/dashboard/distribution',
  },
  EMPLOYEES: {
    BASE: '/employees',
    BY_ID: (id: string | number) => `/employees/${encodeURIComponent(String(id))}`,
  },
  DEPARTMENTS: {
    BASE: '/departments',
    BY_ID: (id: string | number) => `/departments/${encodeURIComponent(String(id))}`,
  },
  ATTENDANCE: {
    BASE: '/attendance',
  },
  HEALTH: '/health',
} as const;

