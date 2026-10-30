import { z } from 'zod';

export const getEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  status: z
    .enum(['Active', 'On Leave', 'Terminated', 'Suspended', 'All Statuses'])
    .optional(),
  sortBy: z
    .enum([
      'id',
      'employee_code',
      'first_name',
      'last_name',
      'email',
      'department_id',
      'department_name',
      'location',
      'job_title',
      'employment_status',
      'hire_date',
      'created_at',
    ])
    .optional()
    .default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const getEmployeeByIdParamsSchema = z.object({
  id: z.string().min(1, 'Employee ID is required'),
});

export const createEmployeeBodySchema = z
  .object({
    employee_code: z.string().min(1).max(20).optional(),
    first_name: z.string().min(1, 'first_name is required').max(100),
    last_name: z.string().min(1, 'last_name is required').max(100),
    email: z.string().email('Invalid email address').max(150).optional(),
    department_id: z.coerce.number().int().positive().optional(),
    department: z.string().optional(),
    department_name: z.string().optional(),
    location: z.string().min(1, 'location is required').max(100),
    job_title: z.string().min(1).max(100).optional(),
    role: z.string().min(1).max(100).optional(),
    employment_status: z
      .enum(['Active', 'On Leave', 'Terminated', 'Suspended'])
      .default('Active'),
    hire_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'hire_date must be in YYYY-MM-DD format')
      .optional(),
  })
  .refine(
    (data) => Boolean(data.job_title || data.role),
    { message: 'job_title or role is required', path: ['job_title'] }
  );

export type GetEmployeesQuery = z.infer<typeof getEmployeesQuerySchema>;
export type GetEmployeeByIdParams = z.infer<typeof getEmployeeByIdParamsSchema>;
export type CreateEmployeeBody = z.infer<typeof createEmployeeBodySchema>;

