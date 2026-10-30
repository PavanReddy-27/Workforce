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
    const totalPresent = rawPoint.inOffice + rawPoint.remote;
    const inOfficeShare = totalPresent > 0 ? ((rawPoint.inOffice / totalPresent) * 100).toFixed(1) : '0.0';
    const remoteShare = totalPresent > 0 ? ((rawPoint.remote / totalPresent) * 100).toFixed(1) : '0.0';

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
          {label} — Workforce Presence
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
                  In-Office:
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {rawPoint.inOffice.toLocaleString()}{' '}
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400, fontSize: '0.6875rem' }}>
                  ({inOfficeShare}%)
                </Box>
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#0284C7' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Remote:
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {rawPoint.remote.toLocaleString()}{' '}
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400, fontSize: '0.6875rem' }}>
                  ({remoteShare}%)
                </Box>
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D97706' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Approved Leave:
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {rawPoint.onLeave.toLocaleString()}
              </Typography>
            </Box>

            <Divider sx={{ my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Total Present Today:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#2563EB' }}>
                {totalPresent.toLocaleString()} ({rawPoint.attendanceRate}%)
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
  const totalInOffice = data.reduce((acc, curr) => acc + curr.inOffice, 0);
  const totalRemote = data.reduce((acc, curr) => acc + curr.remote, 0);
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
                Attendance Trend & Work Mode
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.25, display: 'block' }}>
              Presence velocity: In-office vs. remote vs. approved leave across {timeRange.toUpperCase()}
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={viewType}
            exclusive
            size="small"
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
            <ToggleButton value="breakdown">Headcount</ToggleButton>
            <ToggleButton value="rate">Rate %</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Chart Canvas */}
        <Box sx={{ width: '100%', height: 285, minWidth: 0, minHeight: 0, my: 0.5 }}>
          <ResponsiveContainer width="100%" height={285} minWidth={0} minHeight={0}>
            {viewType === 'breakdown' ? (
              <AreaChart
                data={data}
                margin={{ top: 12, right: 16, left: 4, bottom: 4 }}
              >
                <defs>
                  {/* Restrained, non-muddy fills */}
                  <linearGradient id="colorInOffice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="colorRemote" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.01} />
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
                  dataKey="inOffice"
                  name="In-Office"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorInOffice)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="remote"
                  name="Remote Active"
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  fillOpacity={1}
                  fill="url(#colorRemote)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="onLeave"
                  name="Approved Leave"
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
                  domain={[80, 100]}
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
              In-Office Cycle Total:{' '}
              <Box component="span" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                {totalInOffice.toLocaleString()}
              </Box>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: '#0284C7' }} />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
              Remote Cycle Total:{' '}
              <Box component="span" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                {totalRemote.toLocaleString()}
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
