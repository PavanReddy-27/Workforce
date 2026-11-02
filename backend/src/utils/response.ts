import type { Response } from 'express';

export interface StandardSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
  summary?: unknown;
  message?: string;
  timestamp: string;
}

export interface StandardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  options?: {
    message?: string;
    pagination?: {
      page: number;
      limit: number;
      totalRecords: number;
      totalPages: number;
    };
    summary?: unknown;
  }
): Response => {
  const payload: StandardSuccessResponse<T> = {
    success: true,
    data,
    ...(options?.pagination ? { pagination: options.pagination } : {}),
    ...(options?.summary !== undefined ? { summary: options.summary } : {}),
    ...(options?.message ? { message: options.message } : {}),
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): Response => {
  const payload: StandardErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
};
