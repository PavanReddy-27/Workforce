/**
 * KPI Card Component
 * Displays a single key performance metric with icon, value, trend badge,
 * and an optional micro progress bar for capacity-type metrics.
 */

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import type { KpiMetric } from '../types';

interface KpiCardProps {
  metric: KpiMetric;
  loading?: boolean;
}

const KPI_ICON_MAP: Record<string, React.ReactNode> = {
  'Total Employees': <PeopleAltOutlinedIcon />,
  'Present Today': <CheckCircleOutlinedIcon />,
  'Absent Today': <CancelOutlinedIcon />,
  'On Leave': <EventBusyOutlinedIcon />,
  'Attendance Rate': <TrendingUpIcon />,
};

const KPI_COLOR_MAP: Record<string, string> = {
  'Total Employees': '#6366F1',
  'Present Today': '#10B981',
  'Absent Today': '#EF4444',
  'On Leave': '#F59E0B',
  'Attendance Rate': '#3B82F6',
};

/** Extract numeric percent 0–100 if the metric looks like "94.1%" */
function parseProgressValue(metric: KpiMetric): number | null {
  if (metric.title === 'Attendance Rate') {
    const n = metric.numericValue ?? parseFloat(String(metric.value));
    return isNaN(n) ? null : Math.min(100, Math.max(0, n));
  }
  return null;
}

export const KpiCard: React.FC<KpiCardProps> = ({ metric, loading = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const isGoodTrend = metric.isPositive ?? true;
  const trendColor = isGoodTrend ? theme.palette.success.main : theme.palette.error.main;
  const accentColor = KPI_COLOR_MAP[metric.title] ?? theme.palette.primary.main;
  const icon = KPI_ICON_MAP[metric.title];
  const progressValue = parseProgressValue(metric);

  if (loading) {
    return (
      <Card sx={{ height: '100%', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Skeleton variant="text" width="55%" height={16} />
          <Skeleton variant="rounded" width={32} height={32} />
        </Box>
        <Skeleton variant="text" width="45%" height={38} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="70%" height={14} />
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        cursor: 'default',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark
            ? '0 8px 24px rgba(0, 0, 0, 0.45)'
            : '0 8px 24px rgba(15, 23, 42, 0.1)',
        },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${accentColor}, ${alpha(accentColor, 0.4)})`,
          borderRadius: '10px 10px 0 0',
        },
      }}
    >
      <CardContent sx={{ p: 2, pb: '14px !important', flexGrow: 1 }}>
        {/* Header: title + icon badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: 1.25,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 600,
              fontSize: '0.6875rem',
              lineHeight: 1.3,
              letterSpacing: '0.06em',
            }}
          >
            {metric.title}
          </Typography>

          {icon && (
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '9px',
                backgroundColor: alpha(accentColor, isDark ? 0.2 : 0.1),
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                '& svg': { fontSize: 18 },
                transition: 'background-color 0.2s ease',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {/* Primary numeric value */}
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.625rem', sm: '1.875rem' },
            letterSpacing: '-0.03em',
            color: theme.palette.text.primary,
            lineHeight: 1.05,
            fontVariantNumeric: 'tabular-nums',
            mb: progressValue !== null ? 1.25 : 1,
          }}
        >
          {metric.value}
        </Typography>

        {/* Progress bar (only for rate-type metrics) */}
        {progressValue !== null && (
          <Box sx={{ mb: 1, position: 'relative' }}>
            <Box
              sx={{
                height: 5,
                borderRadius: 3,
                backgroundColor: isDark
                  ? 'rgba(148, 163, 184, 0.12)'
                  : 'rgba(15, 23, 42, 0.07)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  width: `${progressValue}%`,
                  background: `linear-gradient(90deg, ${accentColor}, ${alpha(accentColor, 0.7)})`,
                  transition: 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              />
            </Box>
          </Box>
        )}

        {/* Trend badge + period */}
        {metric.change !== undefined ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.25,
                color: trendColor,
                fontSize: '0.7rem',
                fontWeight: 700,
                backgroundColor: alpha(trendColor, 0.1),
                borderRadius: '4px',
                px: 0.75,
                py: 0.2,
              }}
            >
              {metric.change >= 0 ? (
                <ArrowUpwardIcon sx={{ fontSize: 11 }} />
              ) : (
                <ArrowDownwardIcon sx={{ fontSize: 11 }} />
              )}
              {Math.abs(metric.change)}%
            </Box>
            {metric.period && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                  fontSize: '0.6875rem',
                }}
              >
                {metric.period}
              </Typography>
            )}
          </Box>
        ) : metric.period ? (
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.6875rem' }}
          >
            {metric.period}
          </Typography>
        ) : null}

        {/* Subtitle */}
        {metric.subtitle && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: theme.palette.text.secondary,
              fontSize: '0.6875rem',
              mt: 0.5,
              opacity: 0.85,
              lineHeight: 1.4,
            }}
          >
            {metric.subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiCard;
