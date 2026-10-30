import type { Request, Response } from 'express';
import { sendError } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(
    res,
    404,
    'ROUTE_NOT_FOUND',
    `The requested route '${req.method} ${req.originalUrl}' does not exist.`
  );
};
