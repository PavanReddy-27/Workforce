import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const uuidv4 = (): string => crypto.randomUUID();
import { AuthRepository } from '../repositories/auth.repository';
import { MfaService } from './mfa.service';
import { AuditService } from './audit.service';
import { config } from '../config/env';
import type {
  UserRole,
  SafeUser,
  AuthTokens,
  LoginResult,
  JwtAccessPayload,
  JwtRefreshPayload,
  UserSessionRow,
} from '../types/auth.types';

export class AuthError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, status = 400, code = 'AUTH_ERROR', details?: unknown) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class AuthService {
  constructor(
    private readonly authRepo = new AuthRepository(),
    private readonly mfaService = new MfaService(),
    private readonly auditService = new AuditService(authRepo)
  ) {}

  public getRepo(): AuthRepository {
    return this.authRepo;
  }

  public async getDemoAccounts(customRepo?: AuthRepository) {
    const repo = customRepo || this.authRepo;
    return repo.getDemoAccounts();
  }

  // --- Password Management ---

  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // --- Login & MFA ---

  public async login(
    email: string,
    password: string,
    meta: { ipAddress: string; userAgent?: string }
  ): Promise<LoginResult> {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.authRepo.findByEmail(cleanEmail);

    if (!user) {
      this.authRepo.recordLoginAttempt({
        email: cleanEmail,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        success: false,
        failureReason: 'User not found',
      });
      this.auditService.log({
        action: 'LOGIN_FAILED',
        resourceType: 'auth',
        details: { reason: 'invalid_credentials' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new AuthError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check account lockout
    if (user.locked_until) {
      const lockExpiry = new Date(user.locked_until).getTime();
      const now = Date.now();
      if (lockExpiry > now) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));
        this.auditService.log({
          userId: user.id,
          action: 'LOGIN_LOCKED_ATTEMPT',
          resourceType: 'auth',
          details: { remainingMinutes },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        });
        throw new AuthError(
          `Account is temporarily locked due to excessive failed attempts. Try again in ${remainingMinutes} minute(s).`,
          423,
          'ACCOUNT_LOCKED',
          { remainingMinutes, lockedUntil: user.locked_until }
        );
      } else {
        // Lock has elapsed, reset counter
        this.authRepo.resetFailedAttempts(user.id);
      }
    }

    // Check active status
    if (!user.is_active) {
      this.authRepo.recordLoginAttempt({
        email: cleanEmail,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        success: false,
        failureReason: 'Account deactivated',
      });
      this.auditService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resourceType: 'auth',
        details: { reason: 'account_deactivated' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new AuthError('Your account has been deactivated. Please contact your administrator.', 403, 'ACCOUNT_DISABLED');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      const lockResult = this.authRepo.recordFailedLogin(
        user.id,
        config.MAX_LOGIN_ATTEMPTS,
        config.LOCKOUT_DURATION_MINUTES
      );

      this.authRepo.recordLoginAttempt({
        email: cleanEmail,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        success: false,
        failureReason: 'Invalid password',
      });
      this.auditService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resourceType: 'auth',
        details: { reason: 'invalid_credentials', failedAttempts: lockResult.attempts },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      if (lockResult.locked) {
        this.auditService.log({
          userId: user.id,
          action: 'ACCOUNT_LOCKED',
          resourceType: 'user',
          resourceId: String(user.id),
          details: { failedAttempts: lockResult.attempts, lockedUntil: lockResult.lockedUntil },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        });

        throw new AuthError(
          `Account locked due to ${config.MAX_LOGIN_ATTEMPTS} consecutive failed login attempts. Please wait ${config.LOCKOUT_DURATION_MINUTES} minutes.`,
          423,
          'ACCOUNT_LOCKED',
          { lockedUntil: lockResult.lockedUntil }
        );
      }

      const remainingAttempts = Math.max(0, config.MAX_LOGIN_ATTEMPTS - lockResult.attempts);
      throw new AuthError(
        `Invalid email or password. ${remainingAttempts} attempt(s) remaining before account lockout.`,
        401,
        'INVALID_CREDENTIALS',
        { remainingAttempts }
      );
    }

    // If MFA is enabled, issue short-lived MFA challenge token
    if (user.mfa_enabled) {
      const challengeId = uuidv4();
      const mfaToken = jwt.sign(
        { userId: user.id, mfaPending: true },
        config.JWT_ACCESS_SECRET,
        { expiresIn: '5m', algorithm: 'HS256', jwtid: challengeId }
      );
      this.authRepo.createMfaLoginChallenge(
        challengeId,
        user.id,
        this.getTokenExpiration(mfaToken)
      );

      return {
        requiresMfa: true,
        mfaToken,
      };
    }

    // Standard Login Success
    return this.completeLogin(user.id, meta);
  }

  public async verifyMfaLogin(
    mfaToken: string,
    code: string,
    meta: { ipAddress: string; userAgent?: string }
  ): Promise<AuthTokens> {
    let payload: { userId: number; mfaPending: boolean; jti?: string };
    try {
      payload = jwt.verify(mfaToken, config.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as {
        userId: number;
        mfaPending: boolean;
        jti?: string;
      };
    } catch {
      throw new AuthError('MFA session expired or invalid. Please log in again.', 401, 'MFA_SESSION_EXPIRED');
    }

    if (!payload.mfaPending || !payload.userId || !payload.jti) {
      throw new AuthError('Invalid MFA token', 401, 'INVALID_MFA_TOKEN');
    }

    if (!this.authRepo.isMfaLoginChallengeUsable(payload.jti, payload.userId)) {
      throw new AuthError('MFA challenge was already used or expired. Please log in again.', 401, 'MFA_CHALLENGE_USED');
    }

    const user = this.authRepo.findById(payload.userId);
    if (!user || !user.is_active || !user.mfa_enabled || !user.mfa_secret) {
      throw new AuthError('MFA is not configured for this account', 400, 'MFA_NOT_CONFIGURED');
    }

    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      throw new AuthError('Account is temporarily locked. Please try again later.', 423, 'ACCOUNT_LOCKED');
    } else if (user.locked_until) {
      this.authRepo.resetFailedAttempts(user.id);
    }

    const secret = this.mfaService.decryptSecret(user.mfa_secret);
    const isTotpValid = this.mfaService.verifyToken(code, secret);
    let backupCodeUpdate: { current: string; remaining: string } | undefined;

    if (!isTotpValid && user.mfa_backup_codes) {
      const backupCheck = this.mfaService.verifyBackupCode(code, user.mfa_backup_codes);
      if (backupCheck.valid && backupCheck.remainingCodesJson !== null) {
        backupCodeUpdate = {
          current: user.mfa_backup_codes,
          remaining: backupCheck.remainingCodesJson,
        };
      }
    }

    if (!isTotpValid && !backupCodeUpdate) {
      this.authRepo.recordLoginAttempt({
        email: user.email,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        success: false,
        failureReason: 'Invalid MFA verification code',
      });
      const lockResult = this.authRepo.recordFailedLogin(
        user.id,
        config.MAX_LOGIN_ATTEMPTS,
        config.LOCKOUT_DURATION_MINUTES
      );
      if (lockResult.locked) {
        this.auditService.log({
          userId: user.id,
          action: 'ACCOUNT_LOCKED',
          resourceType: 'user',
          resourceId: String(user.id),
          details: { failedAttempts: lockResult.attempts, lockedUntil: lockResult.lockedUntil },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        });
        throw new AuthError('Account locked due to excessive failed verification attempts.', 423, 'ACCOUNT_LOCKED');
      }
      this.auditService.log({
        userId: user.id,
        action: 'MFA_LOGIN_FAILED',
        resourceType: 'auth',
        details: { failedAttempts: lockResult.attempts },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new AuthError('Invalid verification code. Please check your authenticator app or backup code.', 401, 'INVALID_MFA_CODE');
    }

    if (!this.authRepo.consumeMfaLoginChallenge(payload.jti, user.id, backupCodeUpdate)) {
      throw new AuthError('MFA challenge was already used or expired. Please log in again.', 401, 'MFA_CHALLENGE_USED');
    }

    if (backupCodeUpdate) {
      this.auditService.log({
        userId: user.id,
        action: 'MFA_BACKUP_CODE_USED',
        resourceType: 'user',
        resourceId: String(user.id),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }

    const result = await this.completeLogin(user.id, meta);
    return result.tokens!;
  }

  // --- Refresh Token Rotation ---

  public async refreshTokens(
    refreshToken: string,
    meta: { ipAddress: string; userAgent?: string }
  ): Promise<AuthTokens> {
    let payload: JwtRefreshPayload;
    try {
      payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
      }) as JwtRefreshPayload;
    } catch {
      throw new AuthError('Invalid or expired refresh token. Please sign in again.', 401, 'INVALID_REFRESH_TOKEN');
    }

    const tokenHash = this.hashToken(refreshToken);
    const existingToken = this.authRepo.findRefreshToken(tokenHash);

    if (
      !existingToken ||
      payload.userId !== existingToken.user_id ||
      payload.familyId !== existingToken.family_id ||
      payload.sessionId !== existingToken.session_id
    ) {
      throw new AuthError('Refresh token not found or subject mismatch. Please sign in again.', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Reuse detection!
    if (existingToken.revoked) {
      // A revoked token was presented — revoke entire family!
      this.authRepo.revokeFamily(existingToken.family_id);
      this.authRepo.revokeAllUserSessions(existingToken.user_id);

      this.auditService.log({
        userId: existingToken.user_id,
        action: 'TOKEN_REUSE_DETECTED',
        resourceType: 'auth',
        details: { familyId: existingToken.family_id },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      throw new AuthError('Security violation detected: token reuse. All active sessions have been terminated. Please sign in again.', 401, 'TOKEN_REUSE_DETECTED');
    }

    if (new Date(existingToken.expires_at).getTime() < Date.now()) {
      throw new AuthError('Refresh token has expired. Please sign in again.', 401, 'REFRESH_TOKEN_EXPIRED');
    }

    const safeUser = this.authRepo.findSafeUserById(existingToken.user_id);
    if (!safeUser || !safeUser.is_active) {
      throw new AuthError('User account inactive or removed.', 403, 'USER_INACTIVE');
    }

    // Generate new rotated pair in the SAME family
    const activeSession = this.authRepo.findActiveSession(payload.sessionId);
    if (!activeSession || activeSession.user_id !== safeUser.id) {
      throw new AuthError('Session has ended. Please sign in again.', 401, 'SESSION_INVALIDATED');
    }

    const newAccessToken = this.generateAccessToken(safeUser, payload.sessionId);
    const newRefreshToken = this.generateRefreshToken(safeUser.id, existingToken.family_id, payload.sessionId);
    const newRefreshHash = this.hashToken(newRefreshToken);
    const refreshExpiresAt = this.getTokenExpiration(newRefreshToken);
    const rotation = this.authRepo.rotateRefreshToken({
      currentTokenHash: tokenHash,
      userId: safeUser.id,
      sessionId: payload.sessionId,
      familyId: existingToken.family_id,
      replacementTokenHash: newRefreshHash,
      expiresAt: refreshExpiresAt,
    });

    if (rotation === 'reused') {
      this.authRepo.revokeFamily(existingToken.family_id);
      this.authRepo.revokeAllUserSessions(existingToken.user_id);
      this.auditService.log({
        userId: existingToken.user_id,
        action: 'TOKEN_REUSE_DETECTED',
        resourceType: 'auth',
        details: { familyId: existingToken.family_id },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new AuthError('Refresh token reuse detected. Please sign in again.', 401, 'TOKEN_REUSE_DETECTED');
    }
    if (rotation !== 'rotated') {
      throw new AuthError('Session has ended. Please sign in again.', 401, 'SESSION_INVALIDATED');
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.getTokenLifetime(newAccessToken),
      user: safeUser,
    };
  }

  // --- Logout ---

  public async logout(
    refreshToken?: string,
    sessionId?: string,
    meta?: { ipAddress?: string; userAgent?: string; userId?: number }
  ): Promise<void> {
    const tokenSession = refreshToken
      ? this.authRepo.findRefreshSession(this.hashToken(refreshToken))?.session_id
      : undefined;
    const activeSessionId = sessionId || tokenSession || undefined;
    if (activeSessionId) {
      this.authRepo.revokeRefreshTokensBySession(activeSessionId);
      this.authRepo.revokeSession(activeSessionId);
    }

    if (meta?.userId) {
      this.auditService.log({
        userId: meta.userId,
        action: 'AUTH_LOGOUT',
        resourceType: 'auth',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }
  }

  // --- MFA Setup & Management ---

  public async setupMfa(userId: number): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = this.authRepo.findById(userId);
    if (!user) throw new AuthError('User not found', 404, 'USER_NOT_FOUND');
    if (user.mfa_enabled) {
      throw new AuthError('MFA is already enabled for this account', 409, 'MFA_ALREADY_ENABLED');
    }

    const { secret, otpauthUrl } = this.mfaService.generateSecret(user.email);
    const qrCodeUrl = await this.mfaService.generateQrCode(otpauthUrl);

    // Store secret provisionally
    this.authRepo.updateMfa(userId, false, this.mfaService.encryptSecret(secret), null);

    return { secret, qrCodeUrl };
  }

  public async confirmMfaSetup(
    userId: number,
    code: string,
    meta: { ipAddress?: string; userAgent?: string },
    currentSessionId?: string
  ): Promise<{ backupCodes: string[] }> {
    const user = this.authRepo.findById(userId);
    if (!user || !user.mfa_secret) {
      throw new AuthError('MFA setup has not been initiated', 400, 'MFA_NOT_INITIATED');
    }
    if (user.mfa_enabled) {
      throw new AuthError('MFA is already enabled for this account', 409, 'MFA_ALREADY_ENABLED');
    }

    const secret = this.mfaService.decryptSecret(user.mfa_secret);
    const isValid = this.mfaService.verifyToken(code, secret);
    if (!isValid) {
      throw new AuthError('Invalid verification code from authenticator app', 400, 'INVALID_MFA_CODE');
    }

    const backupCodes = this.mfaService.generateBackupCodes(8);
    this.authRepo.updateMfa(userId, true, user.mfa_secret, this.mfaService.hashBackupCodes(backupCodes));
    this.authRepo.revokeOtherUserSessions(userId, currentSessionId);

    this.auditService.log({
      userId,
      action: 'MFA_ENABLED',
      resourceType: 'user',
      resourceId: String(userId),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { backupCodes };
  }

  public async disableMfa(
    userId: number,
    password: string,
    meta: { ipAddress?: string; userAgent?: string },
    currentSessionId?: string
  ): Promise<void> {
    const user = this.authRepo.findById(userId);
    if (!user) throw new AuthError('User not found', 404, 'USER_NOT_FOUND');

    const isPasswordValid = await this.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AuthError('Invalid password confirmation', 400, 'INVALID_PASSWORD');
    }

    this.authRepo.updateMfa(userId, false, null, null);
    this.authRepo.revokeOtherUserSessions(userId, currentSessionId);

    this.auditService.log({
      userId,
      action: 'MFA_DISABLED',
      resourceType: 'user',
      resourceId: String(userId),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  // --- Password Change ---

  public async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
    meta: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    const user = this.authRepo.findById(userId);
    if (!user) throw new AuthError('User not found', 404, 'USER_NOT_FOUND');

    const isPasswordValid = await this.verifyPassword(oldPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new AuthError('Incorrect current password', 400, 'INVALID_CURRENT_PASSWORD');
    }

    if (newPassword.length < 8) {
      throw new AuthError('New password must be at least 8 characters long', 400, 'PASSWORD_TOO_SHORT');
    }

    const newHash = await this.hashPassword(newPassword);
    this.authRepo.updatePassword(userId, newHash);
    this.authRepo.revokeAllUserSessions(userId);

    this.auditService.log({
      userId,
      action: 'PASSWORD_CHANGED',
      resourceType: 'user',
      resourceId: String(userId),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  // --- Admin User & Session Operations ---

  public getUsers(page = 1, limit = 50): { users: SafeUser[]; total: number } {
    return this.authRepo.listUsers(page, limit);
  }

  public async createUser(
    data: {
      username: string;
      email: string;
      password: string;
      role: UserRole;
      employeeId?: number | null;
    },
    adminUserId: number,
    meta: { ipAddress?: string; userAgent?: string }
  ): Promise<SafeUser> {
    const existingEmail = this.authRepo.findByEmail(data.email);
    if (existingEmail) {
      throw new AuthError('A user with this email address already exists', 400, 'EMAIL_EXISTS');
    }

    const existingUsername = this.authRepo.findByUsername(data.username);
    if (existingUsername) {
      throw new AuthError('A user with this username already exists', 400, 'USERNAME_EXISTS');
    }

    const passwordHash = await this.hashPassword(data.password);
    const created = this.authRepo.createUser({
      username: data.username,
      email: data.email,
      password_hash: passwordHash,
      role: data.role,
      employee_id: data.employeeId,
    });

    this.auditService.log({
      userId: adminUserId,
      action: 'USER_CREATED',
      resourceType: 'user',
      resourceId: String(created.id),
      details: { username: data.username, email: data.email, role: data.role },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return this.authRepo.findSafeUserById(created.id)!;
  }

  public updateUserRole(
    targetUserId: number,
    role: UserRole,
    adminUserId: number,
    meta: { ipAddress?: string; userAgent?: string }
  ): SafeUser {
    const target = this.authRepo.findById(targetUserId);
    if (!target) throw new AuthError('Target user not found', 404, 'USER_NOT_FOUND');

    this.authRepo.updateUserRole(targetUserId, role);
    this.authRepo.revokeAllUserSessions(targetUserId);

    this.auditService.log({
      userId: adminUserId,
      action: 'ROLE_CHANGED',
      resourceType: 'user',
      resourceId: String(targetUserId),
      details: { oldRole: target.role, newRole: role },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return this.authRepo.findSafeUserById(targetUserId)!;
  }

  public updateUserStatus(
    targetUserId: number,
    isActive: boolean,
    adminUserId: number,
    meta: { ipAddress?: string; userAgent?: string }
  ): SafeUser {
    const target = this.authRepo.findById(targetUserId);
    if (!target) throw new AuthError('Target user not found', 404, 'USER_NOT_FOUND');

    if (target.id === adminUserId && !isActive) {
      throw new AuthError('You cannot deactivate your own administrative account', 400, 'SELF_DEACTIVATION_PROHIBITED');
    }

    this.authRepo.updateUserStatus(targetUserId, isActive);
    if (!isActive) {
      this.authRepo.revokeAllUserSessions(targetUserId);
    }

    this.auditService.log({
      userId: adminUserId,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      resourceType: 'user',
      resourceId: String(targetUserId),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return this.authRepo.findSafeUserById(targetUserId)!;
  }

  public getSessions(userId?: number): UserSessionRow[] {
    return this.authRepo.getUserSessions(userId);
  }

  public revokeSession(
    sessionId: number,
    requester: { id: number; role: UserRole },
    meta?: { ipAddress?: string; userAgent?: string }
  ): void {
    const revoked = this.authRepo.revokeSessionById(sessionId, requester.id, requester.role === 'admin');
    if (!revoked) {
      throw new AuthError('Session not found or you are not allowed to revoke it.', 404, 'SESSION_NOT_FOUND');
    }

    this.auditService.log({
      userId: requester.id,
      action: 'SESSION_REVOKED',
      resourceType: 'session',
      resourceId: String(sessionId),
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  public getSafeUser(userId: number): SafeUser | undefined {
    return this.authRepo.findSafeUserById(userId);
  }

  // --- Internal Helpers ---

  private async completeLogin(
    userId: number,
    meta: { ipAddress: string; userAgent?: string }
  ): Promise<LoginResult> {
    const safeUser = this.authRepo.findSafeUserById(userId)!;
    this.authRepo.recordSuccessfulLogin(userId);

    const sessionToken = uuidv4();
    const familyId = uuidv4();
    const refreshToken = this.generateRefreshToken(userId, familyId, sessionToken);
    const sessionExpiresAt = this.getTokenExpiration(refreshToken);
    this.authRepo.createSession({
      userId,
      sessionToken,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt: sessionExpiresAt,
    });

    const accessToken = this.generateAccessToken(safeUser, sessionToken);
    const refreshHash = this.hashToken(refreshToken);

    this.authRepo.createRefreshToken({
      userId,
      sessionId: sessionToken,
      tokenHash: refreshHash,
      familyId,
      expiresAt: sessionExpiresAt,
    });

    this.authRepo.recordLoginAttempt({
      email: safeUser.email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      success: true,
    });

    this.auditService.log({
      userId,
      action: 'LOGIN_SUCCESS',
      resourceType: 'auth',
      details: { role: safeUser.role },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: this.getTokenLifetime(accessToken),
        user: safeUser,
      },
    };
  }

  private generateAccessToken(user: SafeUser, sessionId: string): string {
    const payload: JwtAccessPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      employeeId: user.employee_id,
      sessionId,
    };

    return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    });
  }

  private generateRefreshToken(userId: number, familyId: string, sessionId: string): string {
    const tokenValue = uuidv4();
    const payload: JwtRefreshPayload = {
      userId,
      familyId,
      tokenHash: tokenValue,
      sessionId,
    };

    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    });
  }

  private getTokenExpiration(token: string): string {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string' || typeof decoded.exp !== 'number') {
      throw new Error('Generated JWT does not contain an expiration');
    }
    return new Date(decoded.exp * 1000).toISOString();
  }

  private getTokenLifetime(token: string): number {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string' || typeof decoded.exp !== 'number' || typeof decoded.iat !== 'number') {
      throw new Error('Generated JWT does not contain a valid lifetime');
    }
    return decoded.exp - decoded.iat;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
