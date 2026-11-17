import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { AttendanceClockCard } from '../attendance/AttendanceClockCard';
import { AttendanceTrendChart } from '../../components/AttendanceTrendChart';
import { attendanceService } from '../../services';
import { useAuth } from '../../context';
import type { AttendanceDataPoint, AttendanceWithEmployee, TimeRange } from '../../types';
import { formatAttendanceDate, formatAttendanceTime } from '../../utils';

interface EmployeeDashboardProps {
  trendPoints: AttendanceDataPoint[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  loading: boolean;
  trendError?: string;
  onRefresh: () => void;
}

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

function getHistoryRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function getStatusColor(status: AttendanceWithEmployee['status']): 'success' | 'error' | 'warning' {
  if (status === 'Present') return 'success';
  if (status === 'On Leave') return 'warning';
  return 'error';
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  trendPoints,
  timeRange,
  onTimeRangeChange,
  loading,
  trendError,
  onRefresh,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [history, setHistory] = useState<AttendanceWithEmployee[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const range = getHistoryRange();
    setHistoryLoading(true);
    setHistoryError(null);
    attendanceService
      .getAttendance(
        { ...range, page: 1, limit: 100, sortBy: 'attendance_date', sortOrder: 'desc' },
        { signal: controller.signal }
      )
      .then((response) => {
        if (!response.success) throw new Error(response.message || 'Unable to load attendance history.');
        setHistory(response.data);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setHistoryError(
            requestError instanceof Error ? requestError.message : 'Unable to load attendance history.'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setHistoryLoading(false);
      });

    return () => controller.abort();
  }, [historyRefresh]);

  const presentDays = history.filter((record) => record.status === 'Present').length;
  const recordedDays = history.filter((record) => record.status !== 'On Leave').length;
  const attendanceRate = recordedDays ? Math.round((presentDays / recordedDays) * 100) : 0;
  const recentHistory = history.slice(0, 6);
  const displayName = user?.employee_details?.first_name || user?.username || 'there';

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          color: '#FFFFFF',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(115deg, #172554 0%, #1E3A8A 55%, #312E81 100%)'
            : 'linear-gradient(115deg, #1D4ED8 0%, #2563EB 52%, #4F46E5 100%)',
          boxShadow: '0 12px 30px rgba(37, 99, 235, 0.16)',
        }}
      >
        <Typography variant="overline" sx={{ opacity: 0.78 }}>PERSONAL WORKSPACE</Typography>
        <Typography variant="h4" sx={{ mt: 0.5, fontSize: { xs: '1.6rem', sm: '2rem' } }}>
          Good day, {displayName}
        </Typography>
        <Typography sx={{ mt: 0.75, maxWidth: 620, color: 'rgba(255,255,255,0.82)' }}>
          Your attendance, recent workdays, and personal trends — all in one place.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.25fr) minmax(300px, 0.75fr)' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <AttendanceClockCard
          onAttendanceChanged={() => {
            setHistoryRefresh((value) => value + 1);
            onRefresh();
          }}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 1.5,
          }}
        >
          <MetricCard
            label="Present days"
            value={historyLoading ? null : String(presentDays)}
            caption="Last 30 days"
            icon={<EventAvailableOutlinedIcon />}
            color="#10B981"
          />
          <MetricCard
            label="Attendance rate"
            value={historyLoading ? null : `${attendanceRate}%`}
            caption={`${recordedDays} recorded workdays`}
            icon={<PercentOutlinedIcon />}
            color="#3B82F6"
          />
          <MetricCard
            label="Recent records"
            value={historyLoading ? null : String(history.length)}
            caption="Last 30 days"
            icon={<AccessTimeOutlinedIcon />}
            color="#F59E0B"
          />
          <MetricCard
            label="Team"
            value={user?.employee_details?.department_name || '—'}
            caption={user?.employee_details?.job_title || 'Your department'}
            icon={<EventAvailableOutlinedIcon />}
            color="#8B5CF6"
          />
        </Box>
      </Box>

      {trendError && <Alert severity="warning">{trendError}</Alert>}
      {loading && trendPoints.length === 0 ? (
        <Card><CardContent><Skeleton variant="rounded" height={280} /></CardContent></Card>
      ) : (
        <AttendanceTrendChart data={trendPoints} timeRange={timeRange} />
      )}

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1.5,
              mb: 1.5,
            }}
          >
            <Box>
              <Typography variant="h6">Recent attendance</Typography>
              <Typography variant="body2" color="text.secondary">
                Your latest records from the past 30 days
              </Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={timeRange}
                onChange={(event) => onTimeRangeChange(event.target.value as TimeRange)}
                inputProps={{ 'aria-label': 'Attendance chart date range' }}
              >
                {RANGE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {historyError && <Alert severity="error" sx={{ mb: 1.5 }}>{historyError}</Alert>}
          {historyLoading ? (
            <Stack spacing={1}>
              <Skeleton height={38} />
              <Skeleton height={38} />
              <Skeleton height={38} />
            </Stack>
          ) : recentHistory.length ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" aria-label="Recent personal attendance">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Clock in</TableCell>
                    <TableCell>Clock out</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentHistory.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatAttendanceDate(record.attendance_date)}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" color={getStatusColor(record.status)} label={record.status} />
                      </TableCell>
                      <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatAttendanceTime(record.check_in_time)}
                      </TableCell>
                      <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatAttendanceTime(record.check_out_time)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No attendance records in the last 30 days. Your clock-ins will appear here.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string | null;
  caption: string;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, caption, icon, color }) => (
  <Card sx={{ minWidth: 0 }}>
    <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
        <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
        <Box sx={{ color, display: 'flex', '& svg': { fontSize: 18 } }}>{icon}</Box>
      </Box>
      {value === null ? (
        <Skeleton width="60%" height={34} sx={{ my: 0.5 }} />
      ) : (
        <Typography
          sx={{
            mt: 0.5,
            fontSize: { xs: '1.15rem', sm: '1.4rem' },
            fontWeight: 700,
            letterSpacing: '-0.03em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={value}
        >
          {value}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" noWrap>{caption}</Typography>
    </CardContent>
  </Card>
);
