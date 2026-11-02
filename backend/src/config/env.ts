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
});

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
