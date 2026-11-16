export type UserRole = 'admin' | 'hr' | 'manager' | 'team_lead' | 'employee';

export type Permission =
  | 'dashboard:view'
  | 'employees:read_all'
  | 'employees:read_dept'
  | 'employees:read_own'
  | 'employees:create'
  | 'employees:update'
  | 'employees:delete'
  | 'attendance:read_all'
  | 'attendance:read_dept'
  | 'attendance:read_own'
  | 'attendance:manage'
  | 'departments:read'
  | 'departments:manage'
  | 'export:data'
  | 'users:manage'
  | 'audit:view'
  | 'settings:manage';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'dashboard:view',
    'employees:read_all',
    'employees:read_dept',
    'employees:read_own',
    'employees:create',
    'employees:update',
    'employees:delete',
    'attendance:read_all',
    'attendance:read_dept',
    'attendance:read_own',
    'attendance:manage',
    'departments:read',
    'departments:manage',
    'export:data',
    'users:manage',
    'audit:view',
    'settings:manage',
  ],
  hr: [
    'dashboard:view',
    'employees:read_all',
    'employees:read_dept',
    'employees:read_own',
    'employees:create',
    'employees:update',
    'attendance:read_all',
    'attendance:read_dept',
    'attendance:read_own',
    'attendance:manage',
    'departments:read',
    'export:data',
    'settings:manage',
  ],
  manager: [
    'dashboard:view',
    'employees:read_dept',
    'employees:read_own',
    'attendance:read_dept',
    'attendance:read_own',
    'departments:read',
    'settings:manage',
  ],
  team_lead: [
    'dashboard:view',
    'employees:read_dept',
    'employees:read_own',
    'attendance:read_dept',
    'attendance:read_own',
    'departments:read',
    'settings:manage',
  ],
  employee: [
    'dashboard:view',
    'employees:read_own',
    'attendance:read_own',
    'departments:read',
    'settings:manage',
  ],
};

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  employee_id: number | null;
  is_active: number;
  mfa_enabled: number;
  mfa_secret: string | null;
  mfa_backup_codes: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  password_changed_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafeUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  employee_id: number | null;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login_at: string | null;
  created_at: string;
  permissions: Permission[];
  employee_details?: {
    first_name: string;
    last_name: string;
    job_title: string;
    department_name?: string;
    department_id?: number;
    location?: string;
  } | null;
}

export interface JwtAccessPayload {
  userId: number;
  username: string;
  email: string;
  role: UserRole;
  employeeId: number | null;
  sessionId: string;
  mfaPending?: never;
}

export interface JwtRefreshPayload {
  userId: number;
  familyId: string;
  tokenHash: string;
  sessionId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: SafeUser;
}

export interface LoginResult {
  requiresMfa?: boolean;
  mfaToken?: string;
  tokens?: AuthTokens;
}

export interface AuditLogRow {
  id: number;
  user_id: number | null;
  username?: string | null;
  user_email?: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserSessionRow {
  id: number;
  user_id: number;
  username?: string;
  user_email?: string;
  role?: UserRole;
  session_token?: string;
  ip_address: string | null;
  user_agent: string | null;
  is_active: number;
  last_activity_at: string;
  expires_at: string;
  created_at: string;
}
