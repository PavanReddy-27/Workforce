import type { Request, Response, NextFunction } from 'express';
import { ZodError, type AnyZodObject, type ZodEffects } from 'zod';
import { sendError } from '../utils/response';

type SchemaType = AnyZodObject | ZodEffects<AnyZodObject>;

export interface RequestValidationSchemas {
  query?: SchemaType;
  params?: SchemaType;
  body?: SchemaType;
}

export const validateRequest = (schemas: RequestValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as typeof req.query;
      }
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as typeof req.params;
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request parameters', details);
        return;
      }
      next(err);
    }
  };
};
