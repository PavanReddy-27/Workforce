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
  | 'attendance:mark_own'
  | 'attendance:manage'
  | 'departments:read'
  | 'departments:manage'
  | 'export:data'
  | 'users:manage'
  | 'audit:view'
  | 'settings:manage';

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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: SafeUser;
}

export interface LoginResponse extends Partial<AuthTokens> {
  requiresMfa?: boolean;
  mfaToken?: string;
  tokens?: AuthTokens;
  message?: string;
}

export interface AuditLog {
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

export interface UserSession {
  id: number;
  user_id: number;
  username?: string;
  user_email?: string;
  role?: UserRole;
  ip_address: string | null;
  user_agent: string | null;
  is_active: number;
  last_activity_at: string;
  expires_at: string;
  created_at: string;
}

export interface DemoAccountFromSql {
  id: number;
  label: string;
  role: UserRole;
  roleDisplay: string;
  email: string;
  defaultPassword?: string;
  description: string;
  isSystemDemo?: boolean;
  departmentName?: string;
}
