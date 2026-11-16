import type { Request, Response } from 'express';
import { AuthService, AuthError } from '../services/auth.service';
import { AuditService } from '../services/audit.service';
import { AuthRepository } from '../repositories/auth.repository';
import { sendSuccess, sendError } from '../utils/response';
import { config } from '../config/env';
import type {
  LoginBody,
  MfaLoginBody,
  RefreshTokenBody,
  ChangePasswordBody,
  MfaConfirmBody,
  MfaDisableBody,
  CreateUserBody,
  UpdateUserRoleBody,
  UpdateUserStatusBody,
} from '../schemas/auth.schema';

export class AuthController {
  constructor(
    private readonly authService = new AuthService(),
    private readonly auditService = new AuditService()
  ) {}

  private getRequestMeta(req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'];
    return { ipAddress, userAgent };
  }

  public getDemoAccounts = async (req: Request, res: Response): Promise<void> => {
    if (config.NODE_ENV === 'production') {
      sendError(res, 404, 'NOT_FOUND', 'Demo accounts are not available in production.');
      return;
    }

    try {
      const customRepo = req.app.locals.db ? new AuthRepository(req.app.locals.db) : undefined;
      const accounts = await this.authService.getDemoAccounts(customRepo);
      sendSuccess(res, accounts, 200, {
        message: 'Active demo accounts retrieved from database',
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body as LoginBody;
      const meta = this.getRequestMeta(req);
      const result = await this.authService.login(email, password, meta);

      if (result.requiresMfa) {
        sendSuccess(res, {
          requiresMfa: true,
          mfaToken: result.mfaToken,
          message: 'Two-Factor Authentication required. Enter the 6-digit code from your authenticator app.',
        });
        return;
      }

      sendSuccess(res, result.tokens, 200, {
        message: 'Successfully authenticated',
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public verifyMfa = async (req: Request, res: Response): Promise<void> => {
    try {
      const { mfa_token, code } = req.body as MfaLoginBody;
      const meta = this.getRequestMeta(req);
      const tokens = await this.authService.verifyMfaLogin(mfa_token, code, meta);

      sendSuccess(res, tokens, 200, {
        message: 'Two-factor authentication verified successfully',
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refresh_token } = req.body as RefreshTokenBody;
      const meta = this.getRequestMeta(req);
      const tokens = await this.authService.refreshTokens(refresh_token, meta);

      sendSuccess(res, tokens, 200);
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.body?.refresh_token as string | undefined;
      const sessionId = req.tokenPayload?.sessionId;
      const meta = { ...this.getRequestMeta(req), userId: req.user?.id };

      await this.authService.logout(refreshToken, sessionId, meta);
      sendSuccess(res, { loggedOut: true }, 200, {
        message: 'Successfully logged out and session revoked',
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public getMe = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
      return;
    }
    sendSuccess(res, req.user);
  };

  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
        return;
      }
      const { current_password, new_password } = req.body as ChangePasswordBody;
      const meta = this.getRequestMeta(req);

      await this.authService.changePassword(req.user.id, current_password, new_password, meta);
      sendSuccess(res, { success: true }, 200, {
        message: 'Password changed successfully. Please log in with your new password.',
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public setupMfa = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
        return;
      }
      const setup = await this.authService.setupMfa(req.user.id);
      sendSuccess(res, setup);
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public confirmMfa = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
        return;
      }
      const { code } = req.body as MfaConfirmBody;
      const meta = this.getRequestMeta(req);
      const result = await this.authService.confirmMfaSetup(
        req.user.id,
        code,
        meta,
        req.tokenPayload?.sessionId
      );

      sendSuccess(res, result, 200, {
        message: 'Two-factor authentication has been successfully enabled. Save your backup codes safely.',
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public disableMfa = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
        return;
      }
      const { password } = req.body as MfaDisableBody;
      const meta = this.getRequestMeta(req);
      await this.authService.disableMfa(req.user.id, password, meta, req.tokenPayload?.sessionId);

      sendSuccess(res, { mfa_enabled: false }, 200, {
        message: 'Two-factor authentication has been disabled.',
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  // --- Admin User Management Endpoints ---

  public getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(String(req.query.page || '1'), 10);
      const limit = parseInt(String(req.query.limit || '50'), 10);
      const result = this.authService.getUsers(page, limit);

      sendSuccess(res, result.users, 200, {
        pagination: {
          page,
          limit,
          totalRecords: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as CreateUserBody;
      const meta = this.getRequestMeta(req);
      const adminUserId = req.user?.id || 1;

      const newUser = await this.authService.createUser(
        {
          username: body.username,
          email: body.email,
          password: body.password,
          role: body.role,
          employeeId: body.employee_id,
        },
        adminUserId,
        meta
      );

      sendSuccess(res, newUser, 201, {
        message: `User account '${newUser.username}' created successfully.`,
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public updateUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const targetUserId = parseInt(String(req.params.id), 10);
      const { role } = req.body as UpdateUserRoleBody;
      const meta = this.getRequestMeta(req);
      const adminUserId = req.user?.id || 1;

      const updated = this.authService.updateUserRole(targetUserId, role, adminUserId, meta);
      sendSuccess(res, updated, 200, {
        message: `User role updated to ${role}.`,
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const targetUserId = parseInt(String(req.params.id), 10);
      const { is_active } = req.body as UpdateUserStatusBody;
      const meta = this.getRequestMeta(req);
      const adminUserId = req.user?.id || 1;

      const updated = this.authService.updateUserStatus(targetUserId, is_active, adminUserId, meta);
      sendSuccess(res, updated, 200, {
        message: is_active ? 'User activated' : 'User deactivated and sessions terminated',
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(String(req.query.page || '1'), 10);
      const limit = parseInt(String(req.query.limit || '50'), 10);
      const result = this.auditService.getLogs(page, limit);

      sendSuccess(res, result.logs, 200, {
        pagination: {
          page,
          limit,
          totalRecords: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      // Admin sees all sessions; other roles see only their own sessions
      const targetUserId = req.user?.role === 'admin' ? undefined : req.user?.id;
      const sessions = this.authService.getSessions(targetUserId);
      sendSuccess(res, sessions);
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  public revokeSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = Number(req.params.id);
      if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
        sendError(res, 400, 'INVALID_SESSION_ID', 'A valid session ID is required.');
        return;
      }
      const meta = this.getRequestMeta(req);
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
        return;
      }
      this.authService.revokeSession(sessionId, { id: req.user.id, role: req.user.role }, meta);

      sendSuccess(res, { revoked: true }, 200, {
        message: 'Session revoked successfully.',
      });
    } catch (err) {
      this.handleAuthError(res, err);
    }
  };

  private handleAuthError(res: Response, err: unknown): void {
    if (err instanceof AuthError) {
      sendError(res, err.status, err.code, err.message, err.details);
      return;
    }
    console.error('Unhandled authentication controller error:', err);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected authentication error occurred.');
  }
}
