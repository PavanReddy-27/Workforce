import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import {
  loginRateLimiter,
  mfaLoginRateLimiter,
  sensitiveActionLimiter,
} from '../middleware/rateLimiter';
import {
  loginBodySchema,
  mfaLoginBodySchema,
  refreshTokenBodySchema,
  changePasswordBodySchema,
  mfaConfirmBodySchema,
  mfaDisableBodySchema,
  createUserBodySchema,
  updateUserRoleBodySchema,
  updateUserStatusBodySchema,
} from '../schemas/auth.schema';

const router = Router();
const controller = new AuthController();

// --- Public Auth Endpoints ---
router.get('/demo-accounts', controller.getDemoAccounts);
router.post('/login', loginRateLimiter, validateRequest({ body: loginBodySchema }), controller.login);
router.post('/login/mfa', mfaLoginRateLimiter, validateRequest({ body: mfaLoginBodySchema }), controller.verifyMfa);
router.post('/refresh', sensitiveActionLimiter, validateRequest({ body: refreshTokenBodySchema }), controller.refresh);

// --- Authenticated Profile & Session Operations ---
router.post('/logout', authenticate, sensitiveActionLimiter, controller.logout);
router.get('/me', authenticate, controller.getMe);
router.put('/password', authenticate, sensitiveActionLimiter, validateRequest({ body: changePasswordBodySchema }), controller.changePassword);

// --- MFA Management ---
router.post('/mfa/setup', authenticate, sensitiveActionLimiter, controller.setupMfa);
router.post('/mfa/verify', authenticate, sensitiveActionLimiter, validateRequest({ body: mfaConfirmBodySchema }), controller.confirmMfa);
router.post('/mfa/disable', authenticate, sensitiveActionLimiter, validateRequest({ body: mfaDisableBodySchema }), controller.disableMfa);

// --- Sessions ---
router.get('/sessions', authenticate, controller.getSessions);
router.delete('/sessions/:id', authenticate, sensitiveActionLimiter, controller.revokeSession);

// --- Admin-Only Endpoints (User Management & Audit Logs) ---
router.get('/users', authenticate, requirePermission('users:manage'), controller.getUsers);
router.post('/users', authenticate, requirePermission('users:manage'), sensitiveActionLimiter, validateRequest({ body: createUserBodySchema }), controller.createUser);
router.put('/users/:id/role', authenticate, requirePermission('users:manage'), sensitiveActionLimiter, validateRequest({ body: updateUserRoleBodySchema }), controller.updateUserRole);
router.put('/users/:id/status', authenticate, requirePermission('users:manage'), sensitiveActionLimiter, validateRequest({ body: updateUserStatusBodySchema }), controller.updateUserStatus);
router.get('/audit-logs', authenticate, requirePermission('audit:view'), controller.getAuditLogs);

export const authRoutes = router;
