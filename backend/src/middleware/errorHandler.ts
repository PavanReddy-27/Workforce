import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
  type?: string;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  void next; // Express requires 4 parameters for error handlers
  const statusCode = err.statusCode || err.status || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected internal error occurred';

  if (err.type === 'entity.too.large') {
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body exceeds the allowed size';
  } else if (err.type === 'entity.parse.failed') {
    code = 'INVALID_JSON';
    message = 'Request body contains invalid JSON';
  } else if (err.name === 'SqliteError') {
    if (err.message.includes('FOREIGN KEY constraint failed')) {
      code = 'FOREIGN_KEY_VIOLATION';
      message = 'Referenced resource does not exist';
    } else if (err.message.includes('UNIQUE constraint failed')) {
      code = 'UNIQUE_CONSTRAINT_VIOLATION';
      message = 'A record with the specified unique values already exists';
    } else {
      code = 'DATABASE_ERROR';
      message = 'A database operation failed';
    }
  }

  // In production, never leak stack traces or internal paths
  const details = config.NODE_ENV === 'development' ? err.details : undefined;

  if (statusCode >= 500 && config.NODE_ENV !== 'test') {
    console.error('Unhandled Server Error:', err);
  }

  sendError(res, statusCode, code, message, details);
};
