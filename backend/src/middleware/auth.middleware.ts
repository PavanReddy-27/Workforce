import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthRepository } from '../repositories/auth.repository';
import { sendError } from '../utils/response';
import type { SafeUser, UserRole, Permission, JwtAccessPayload } from '../types/auth.types';

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
  tokenPayload?: JwtAccessPayload;
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      tokenPayload?: JwtAccessPayload;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export const getAuthRepo = (req: Request): AuthRepository => {
  if (req.app?.locals?.db) {
    return new AuthRepository(req.app.locals.db);
  }
  return new AuthRepository();
};

/**
 * Validates JWT access token in the Authorization header.
 * Attaches user profile and session info to request.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication required. Missing Bearer token.');
    return;
  }

  const token = authHeader.slice(7).trim();
  let payload: JwtAccessPayload;

  try {
    payload = jwt.verify(token, config.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    }) as JwtAccessPayload;
  } catch (err) {
    const error = err as Error;
    if (error.name === 'TokenExpiredError') {
      sendError(res, 401, 'TOKEN_EXPIRED', 'Access token has expired. Please refresh your session.');
      return;
    }
    sendError(res, 401, 'INVALID_TOKEN', 'Access token is malformed or invalid.');
    return;
  }

  if (
    !Number.isInteger(payload.userId) ||
    typeof payload.sessionId !== 'string' ||
    payload.sessionId.length === 0 ||
    'mfaPending' in payload
  ) {
    sendError(res, 401, 'INVALID_TOKEN', 'Access token is malformed or invalid.');
    return;
  }

  try {
    const authRepo = getAuthRepo(req);

    const safeUser = authRepo.findSafeUserById(payload.userId);
    if (!safeUser) {
      sendError(res, 401, 'USER_NOT_FOUND', 'The user associated with this token no longer exists.');
      return;
    }

    if (!safeUser.is_active) {
      sendError(res, 403, 'ACCOUNT_DEACTIVATED', 'This user account has been deactivated.');
      return;
    }

    const activeSession = authRepo.findActiveSession(payload.sessionId);
    if (!activeSession) {
      sendError(res, 401, 'SESSION_INVALIDATED', 'Your session has ended or was revoked. Please log in again.');
      return;
    }
    authRepo.updateSessionActivity(payload.sessionId);

    req.user = safeUser;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Restricts route access to specified roles.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required before role check.');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        403,
        'FORBIDDEN',
        `Access denied. Required role: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}.`
      );
      return;
    }

    next();
  };
};

/**
 * Restricts route access to users with specified permissions.
 */
export const requirePermission = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.');
      return;
    }

    const userPerms = new Set(req.user.permissions);
    const hasAll = requiredPermissions.every((p) => userPerms.has(p));

    if (!hasAll) {
      sendError(
        res,
        403,
        'INSUFFICIENT_PERMISSIONS',
        `Access denied. Missing required permissions: [${requiredPermissions.filter((p) => !userPerms.has(p)).join(', ')}].`
      );
      return;
    }

    next();
  };
};

export const requireAnyPermission = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.');
      return;
    }

    if (!requiredPermissions.some((permission) => req.user?.permissions.includes(permission))) {
      sendError(
        res,
        403,
        'INSUFFICIENT_PERMISSIONS',
        `Access denied. Required one of: [${requiredPermissions.join(', ')}].`
      );
      return;
    }

    next();
  };
};

export const getUserDataScope = (
  user: SafeUser
): { employeeId?: number; departmentId?: number } | null => {
  if (user.role === 'admin' || user.role === 'hr') return {};

  const employeeId = user.employee_id;
  const departmentId = user.employee_details?.department_id;
  if (!employeeId || !departmentId) return null;

  if (user.role === 'employee') return { employeeId, departmentId };
  return { departmentId };
};

/**
 * Allows access if the user has an override role (e.g. Admin/HR), OR if
 * the resource belongs to their linked employee account.
 */
export const requireOwnerOrRoles = (
  getTargetEmployeeId: (req: Request) => number | undefined,
  ...overrideRoles: UserRole[]
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.');
      return;
    }

    // Role override (e.g., Admin or HR can view any employee/attendance)
    if (overrideRoles.includes(req.user.role)) {
      next();
      return;
    }

    const targetEmployeeId = getTargetEmployeeId(req);
    if (
      targetEmployeeId !== undefined &&
      req.user.employee_id !== null &&
      req.user.employee_id === targetEmployeeId
    ) {
      next();
      return;
    }

    sendError(
      res,
      403,
      'FORBIDDEN',
      'You are not authorized to access records that do not belong to your account.'
    );
  };
};
