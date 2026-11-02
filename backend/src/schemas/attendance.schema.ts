import { z } from 'zod';
import { isValidIsoDate } from '../utils/date';

const isoDateSchema = z.string().refine(isValidIsoDate, {
  message: 'Invalid date format. Expected YYYY-MM-DD',
});

export const getAttendanceQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    employeeId: z.coerce.number().int().positive().optional(),
    date: isoDateSchema.optional(),
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
    department: z.string().optional(),
    location: z.string().optional(),
    employeeStatus: z.enum(['Active', 'On Leave', 'Terminated', 'Suspended']).optional(),
    search: z.string().trim().optional(),
    status: z.enum(['Present', 'Absent', 'On Leave']).optional(),
    sortBy: z
      .enum(['id', 'employee_id', 'attendance_date', 'status', 'check_in_time', 'created_at'])
      .optional()
      .default('attendance_date'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: 'startDate must be less than or equal to endDate',
      path: ['startDate'],
    }
  );

export type GetAttendanceQuery = z.infer<typeof getAttendanceQuerySchema>;
