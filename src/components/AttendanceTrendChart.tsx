import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import type { AttendanceDataPoint } from '../types';

interface AttendanceTrendChartProps {
  data: AttendanceDataPoint[];
  timeRange: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload: AttendanceDataPoint;
  }>;
  label?: string;
  isRateView: boolean;
  isDark: boolean;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  isRateView,
  isDark,
}) => {
  if (active && payload && payload.length) {
    const rawPoint = payload[0].payload;
    return (
      <Box
        sx={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0'}`,
          p: 1.5,
          borderRadius: '8px',
          boxShadow: isDark
            ? '0 8px 24px rgba(0, 0, 0, 0.45)'
            : '0 8px 24px rgba(15, 23, 42, 0.08)',
          minWidth: 205,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.8125rem' }}>
          Attendance on {label}
        </Typography>

        {isRateView ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Attendance Rate:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.8125rem' }}>
              {rawPoint.attendanceRate}%
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.65 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563EB' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Present:
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {rawPoint.present.toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#EF4444' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Absent:
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {rawPoint.absent.toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D97706' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  On Leave:
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {rawPoint.onLeave.toLocaleString()}
              </Typography>
            </Box>

            <Divider sx={{ my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Attendance Rate:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#2563EB' }}>
                {rawPoint.attendanceRate}%
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    );
  }
  return null;
};

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({ data, timeRange }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [viewType, setViewType] = useState<'breakdown' | 'rate'>('breakdown');

  // Compute summary metrics across data cycle
  const totalPresent = data.reduce((acc, curr) => acc + curr.present, 0);
  const totalAbsent = data.reduce((acc, curr) => acc + curr.absent, 0);
  const avgRate = (
    data.reduce((acc, curr) => acc + curr.attendanceRate, 0) / (data.length || 1)
  ).toFixed(1);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1),
                  color: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShowChartIcon sx={{ fontSize: 17 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                Attendance Trend
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.25, display: 'block' }}>
              Recorded attendance by status across {timeRange.toUpperCase()}
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={viewType}
            exclusive
            size="small"
            aria-label="Attendance trend view mode"
            onChange={(_, val) => {
              if (val) setViewType(val);
            }}
            sx={{
              backgroundColor: isDark ? alpha('#FFFFFF', 0.04) : alpha('#0F172A', 0.04),
              p: '2px',
              borderRadius: '6px',
              '& .MuiToggleButton-root': {
                border: 'none',
                px: 1.25,
                py: 0.35,
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'none',
                color: theme.palette.text.secondary,
                borderRadius: '4px !important',
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: '#FFFFFF',
                },
              },
            }}
          >
            <ToggleButton value="breakdown" aria-label="Headcount breakdown">Headcount</ToggleButton>
            <ToggleButton value="rate" aria-label="Attendance rate percentage">Rate %</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Chart Canvas */}
        <Box sx={{ width: '100%', height: 285, minWidth: 0, minHeight: 0, my: 0.5 }}>
          {!data || data.length === 0 ? (
            <Box
              sx={{
                height: 285,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
                gap: 1,
              }}
            >
              <ShowChartIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                No attendance records match your filter criteria.
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Try selecting a broader date range or clearing department filters.
              </Typography>
            </Box>
          ) : (
          <ResponsiveContainer width="100%" height={285} minWidth={0} minHeight={0}>
            {viewType === 'breakdown' ? (
              <AreaChart
                data={data}
                margin={{ top: 12, right: 16, left: 4, bottom: 4 }}
              >
                <defs>
                  {/* Restrained, non-muddy fills */}
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="colorLeave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.09} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.07)'}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)' }}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  width={45}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => Number(val).toLocaleString()}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                />
                <Tooltip content={<CustomChartTooltip isRateView={false} isDark={isDark} />} />
                <Legend
                  wrapperStyle={{ paddingTop: 8, fontSize: '0.78rem', fontWeight: 500 }}
                  formatter={(value) => (
                    <span style={{ color: theme.palette.text.primary, marginRight: 14 }}>{value}</span>
                  )}
                />
                {/* Clear line weights & distinct stroke patterns */}
                <Area
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPresent)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="absent"
                  name="Absent"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAbsent)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="onLeave"
                  name="On Leave"
                  stroke="#D97706"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLeave)"
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <AreaChart
                data={data}
                margin={{ top: 12, right: 16, left: 4, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.07)'}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)' }}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  width={45}
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                />
                <Tooltip content={<CustomChartTooltip isRateView={true} isDark={isDark} />} />
                <Legend
                  wrapperStyle={{ paddingTop: 8, fontSize: '0.78rem', fontWeight: 500 }}
                  formatter={(value) => (
                    <span style={{ color: theme.palette.text.primary, marginRight: 14 }}>{value}</span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="attendanceRate"
                  name="Attendance Rate (%)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRate)"
                  isAnimationActive={false}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Footer Summary Stats */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
            mt: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563EB' }} />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
              Present Cycle Total:{' '}
              <Box component="span" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                {totalPresent.toLocaleString()}
              </Box>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#0284C7' }} />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
              Absent Cycle Total:{' '}
              <Box component="span" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                {totalAbsent.toLocaleString()}
              </Box>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <FiberManualRecordIcon sx={{ fontSize: 9, color: '#10B981' }} />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
              Cycle Average:{' '}
              <Box component="span" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                {avgRate}%
              </Box>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AttendanceTrendChart;
