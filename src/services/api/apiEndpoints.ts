/**
 * Centralized API Endpoint Definitions
 * Maps frontend service calls to the backend REST routes.
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGIN_MFA: '/auth/login/mfa',
    REFRESH: '/auth/refresh',
    DEMO_ACCOUNTS: '/auth/demo-accounts',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    PASSWORD: '/auth/password',
    MFA_SETUP: '/auth/mfa/setup',
    MFA_VERIFY: '/auth/mfa/verify',
    MFA_DISABLE: '/auth/mfa/disable',
    USERS: '/auth/users',
    USER_ROLE: (id: number | string) => `/auth/users/${encodeURIComponent(String(id))}/role`,
    USER_STATUS: (id: number | string) => `/auth/users/${encodeURIComponent(String(id))}/status`,
    AUDIT_LOGS: '/auth/audit-logs',
    SESSIONS: '/auth/sessions',
    SESSION_BY_ID: (id: number | string) => `/auth/sessions/${encodeURIComponent(String(id))}`,
  },
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
    ATTENDANCE: '/dashboard/attendance',
    ATTENDANCE_TRENDS: '/dashboard/attendance',
    DISTRIBUTION: '/dashboard/distribution',
    WORKFORCE_DISTRIBUTION: '/dashboard/distribution',
  },
  EMPLOYEES: {
    BASE: '/employees',
    LOCATIONS: '/employees/locations',
    EXPORT: '/employees/export',
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
