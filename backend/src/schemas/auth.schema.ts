import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const mfaLoginBodySchema = z.object({
  mfa_token: z.string().min(10, 'Valid MFA token is required'),
  code: z.string().min(4, 'Verification code must be at least 4 characters').max(24),
});

export const refreshTokenBodySchema = z.object({
  refresh_token: z.string().min(10, 'Valid refresh token is required'),
});

export const changePasswordBodySchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});

export const mfaConfirmBodySchema = z.object({
  code: z.string().min(6, 'Verification code must be 6 digits').max(8),
});

export const mfaDisableBodySchema = z.object({
  password: z.string().min(1, 'Password confirmation is required'),
});

export const createUserBodySchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['admin', 'hr', 'manager', 'team_lead', 'employee']),
  employee_id: z.number().int().positive().nullable().optional(),
});

export const updateUserRoleBodySchema = z.object({
  role: z.enum(['admin', 'hr', 'manager', 'team_lead', 'employee']),
});

export const updateUserStatusBodySchema = z.object({
  is_active: z.boolean(),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type MfaLoginBody = z.infer<typeof mfaLoginBodySchema>;
export type RefreshTokenBody = z.infer<typeof refreshTokenBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
export type MfaConfirmBody = z.infer<typeof mfaConfirmBodySchema>;
export type MfaDisableBody = z.infer<typeof mfaDisableBodySchema>;
export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserRoleBody = z.infer<typeof updateUserRoleBodySchema>;
export type UpdateUserStatusBody = z.infer<typeof updateUserStatusBodySchema>;
