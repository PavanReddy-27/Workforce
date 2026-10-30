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

export type GetEmployeesQuery = z.infer<typeof getEmployeesQuerySchema>;
export type GetEmployeeByIdParams = z.infer<typeof getEmployeeByIdParamsSchema>;
