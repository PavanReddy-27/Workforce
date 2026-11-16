import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';
import { config } from '../config/env';

const isTest = config.NODE_ENV === 'test';
const authRateLimit = isTest ? 1000 : config.NODE_ENV === 'development' ? 20 : 5;

const createAuthRateLimiter = (message: string, max: number) => rateLimit({
  windowMs: 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'RATE_LIMIT_EXCEEDED', message);
  },
});

export const createRateLimiters = (overrides: { auth?: number; api?: number; sensitive?: number } = {}) => ({
  login: createAuthRateLimiter(
    'Too many login attempts. Please wait 1 minute before trying again.',
    overrides.auth ?? authRateLimit
  ),
  mfaLogin: createAuthRateLimiter(
    'Too many MFA verification attempts. Please wait 1 minute before trying again.',
    overrides.auth ?? authRateLimit
  ),
  api: rateLimit({
    windowMs: 60 * 1000,
    max: overrides.api ?? (isTest ? 10000 : 120),
    skip: (req) => req.path === '/auth/login' || req.path === '/auth/login/mfa',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      sendError(
        res,
        429,
        'RATE_LIMIT_EXCEEDED',
        'API rate limit exceeded. Please throttle your requests.'
      );
    },
  }),
  sensitive: rateLimit({
    windowMs: 60 * 1000,
    max: overrides.sensitive ?? (isTest ? 1000 : 10),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      sendError(
        res,
        429,
        'RATE_LIMIT_EXCEEDED',
        'Too many requests for this sensitive operation. Please wait a minute.'
      );
    },
  }),
});

const defaultRateLimiters = createRateLimiters();

export const loginRateLimiter = defaultRateLimiters.login;
export const mfaLoginRateLimiter = defaultRateLimiters.mfaLogin;
export const apiRateLimiter = defaultRateLimiters.api;
export const sensitiveActionLimiter = defaultRateLimiters.sensitive;
