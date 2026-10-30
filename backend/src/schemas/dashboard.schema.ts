import { z } from 'zod';
import { isValidIsoDate } from '../utils/date';

const isoDateSchema = z.string().refine(isValidIsoDate, {
  message: 'Invalid date format. Expected YYYY-MM-DD',
});

export const getDashboardSummaryQuerySchema = z.object({
  date: isoDateSchema.optional(),
  department: z.string().optional(),
  location: z.string().optional(),
});

export const getDashboardAttendanceQuerySchema = z
  .object({
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
    timeRange: z.enum(['7d', '30d', '90d', '1y']).optional(),
    department: z.string().optional(),
    location: z.string().optional(),
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

export type GetDashboardSummaryQuery = z.infer<typeof getDashboardSummaryQuerySchema>;
export type GetDashboardAttendanceQuery = z.infer<typeof getDashboardAttendanceQuerySchema>;
