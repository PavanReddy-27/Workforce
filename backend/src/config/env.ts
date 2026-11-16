import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load .env from backend directory
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DB_PATH: z.string().default('./data/workforce.db'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  JWT_ACCESS_SECRET: z.string().default('workforce-jwt-access-secret-key-super-secure-32!'),
  JWT_REFRESH_SECRET: z.string().default('workforce-jwt-refresh-secret-key-super-secure-32!'),
  MFA_ENCRYPTION_KEY: z.string().default('workforce-mfa-encryption-key-dev-only'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  LOCKOUT_DURATION_MINUTES: z.coerce.number().default(15),
}).superRefine((env, ctx) => {
  if (env.CORS_ORIGIN.split(',').some((origin) => origin.trim() === '*')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CORS_ORIGIN'],
      message: 'Wildcard origins are not allowed when credentialed CORS is enabled',
    });
  }
  if (env.NODE_ENV !== 'production') return;

  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MFA_ENCRYPTION_KEY'] as const) {
    if (env[key].length < 32 || env[key] === envSchemaDefaults[key]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: 'A unique secret with at least 32 characters is required in production',
      });
    }
  }
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_REFRESH_SECRET'],
      message: 'JWT access and refresh secrets must be different',
    });
  }
});

const envSchemaDefaults = {
  JWT_ACCESS_SECRET: 'workforce-jwt-access-secret-key-super-secure-32!',
  JWT_REFRESH_SECRET: 'workforce-jwt-refresh-secret-key-super-secure-32!',
  MFA_ENCRYPTION_KEY: 'workforce-mfa-encryption-key-dev-only',
} as const;

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:', result.error.format());
    process.exit(1);
  }
  return result.data;
};

export const config = parseEnv();

// Helper to resolve database path relative to project
export const getResolvedDbPath = (customPath?: string): string => {
  const targetPath = customPath || config.DB_PATH;
  if (targetPath === ':memory:' || targetPath.startsWith('file:')) {
    return targetPath;
  }
  return path.resolve(process.cwd(), targetPath);
};
