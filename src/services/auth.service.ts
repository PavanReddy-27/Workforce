import { httpClient } from './api/httpClient';
import { API_ENDPOINTS } from './api/apiEndpoints';
import type {
  ApiResponse,
  SafeUser,
  AuthTokens,
  LoginResponse,
  UserRole,
  AuditLog,
  UserSession,
  DemoAccountFromSql,
} from '../types';

export class AuthService {
  public async getDemoAccounts(): Promise<ApiResponse<DemoAccountFromSql[]>> {
    return httpClient.get<DemoAccountFromSql[]>(
      API_ENDPOINTS.AUTH.DEMO_ACCOUNTS,
      { skipAuth: true }
    );
  }

  public async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const res = await httpClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      { email, password },
      { skipAuth: true }
    );

    const data = res.data;
    const tokens = data?.tokens || (data?.accessToken && data.refreshToken ? data : null);
    if (res.success && tokens?.accessToken && tokens.refreshToken) {
      httpClient.setTokens(tokens.accessToken, tokens.refreshToken);
    }

    return res;
  }

  public async verifyMfaLogin(mfaToken: string, code: string): Promise<ApiResponse<AuthTokens>> {
    const res = await httpClient.post<AuthTokens>(
      API_ENDPOINTS.AUTH.LOGIN_MFA,
      { mfa_token: mfaToken, code },
      { skipAuth: true }
    );

    if (res.success && res.data?.accessToken && res.data.refreshToken) {
      httpClient.setTokens(res.data.accessToken, res.data.refreshToken);
    }

    return res;
  }

  public async getMe(): Promise<ApiResponse<SafeUser>> {
    return httpClient.get<SafeUser>(API_ENDPOINTS.AUTH.ME);
  }

  public async logout(): Promise<void> {
    try {
      const refreshToken = httpClient.getRefreshToken();
      await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refresh_token: refreshToken });
    } catch {
      // Ignore network errors on logout
    } finally {
      httpClient.setTokens(null, null);
    }
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await httpClient.put<{ success: boolean }>(API_ENDPOINTS.AUTH.PASSWORD, {
      current_password: currentPassword,
      new_password: newPassword,
    });
    httpClient.clearSession();
    return response;
  }

  public async setupMfa(): Promise<ApiResponse<{ secret: string; qrCodeUrl: string }>> {
    return httpClient.post<{ secret: string; qrCodeUrl: string }>(API_ENDPOINTS.AUTH.MFA_SETUP);
  }

  public async confirmMfa(code: string): Promise<ApiResponse<{ backupCodes: string[] }>> {
    return httpClient.post<{ backupCodes: string[] }>(API_ENDPOINTS.AUTH.MFA_VERIFY, { code });
  }

  public async disableMfa(password: string): Promise<ApiResponse<{ mfa_enabled: boolean }>> {
    return httpClient.post<{ mfa_enabled: boolean }>(API_ENDPOINTS.AUTH.MFA_DISABLE, { password });
  }

  // --- Admin User Management ---

  public async getUsers(page = 1, limit = 50): Promise<ApiResponse<SafeUser[]>> {
    return httpClient.get<SafeUser[]>(API_ENDPOINTS.AUTH.USERS, { page, limit });
  }

  public async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: UserRole;
    employee_id?: number | null;
  }): Promise<ApiResponse<SafeUser>> {
    return httpClient.post<SafeUser>(API_ENDPOINTS.AUTH.USERS, userData);
  }

  public async updateUserRole(userId: number, role: UserRole): Promise<ApiResponse<SafeUser>> {
    return httpClient.put<SafeUser>(API_ENDPOINTS.AUTH.USER_ROLE(userId), { role });
  }

  public async updateUserStatus(userId: number, isActive: boolean): Promise<ApiResponse<SafeUser>> {
    return httpClient.put<SafeUser>(API_ENDPOINTS.AUTH.USER_STATUS(userId), { is_active: isActive });
  }

  // --- Audit Logs & Sessions ---

  public async getAuditLogs(page = 1, limit = 50): Promise<ApiResponse<AuditLog[]>> {
    return httpClient.get<AuditLog[]>(API_ENDPOINTS.AUTH.AUDIT_LOGS, { page, limit });
  }

  public async getSessions(): Promise<ApiResponse<UserSession[]>> {
    return httpClient.get<UserSession[]>(API_ENDPOINTS.AUTH.SESSIONS);
  }

  public async revokeSession(sessionId: number): Promise<ApiResponse<{ revoked: boolean }>> {
    return httpClient.delete<{ revoked: boolean }>(API_ENDPOINTS.AUTH.SESSION_BY_ID(sessionId));
  }
}

export const authService = new AuthService();
