/**
 * KPI Card Component
 * Plain, Apple-inspired human-designed metric card.
 * Uses neutral monochrome tones, refined typography, elegant hierarchy,
 * and generous whitespace rather than loud multi-colored accents.
 */

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Skeleton,
  useTheme,
} from '@mui/material';
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

  const icon = KPI_ICON_MAP[metric.title];
  const progressValue = parseProgressValue(metric);

  if (loading) {
    return (
      <Card
        sx={{
          height: '100%',
          p: 2.25,
          borderRadius: '16px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          boxShadow: isDark
            ? '0 1px 3px rgba(0, 0, 0, 0.25)'
            : '0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Skeleton variant="text" width="45%" height={16} />
          <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: '8px' }} />
        </Box>
        <Skeleton variant="text" width="55%" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="70%" height={14} />
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '16px',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        boxShadow: isDark
          ? '0 1px 3px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.2)'
          : '0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)',
        transition:
          'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.18s ease',
        cursor: 'default',
        '&:hover': {
          transform: 'translateY(-1px)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
          boxShadow: isDark
            ? '0 6px 18px rgba(0, 0, 0, 0.35)'
            : '0 6px 18px rgba(0, 0, 0, 0.06)',
        },
      }}
    >
      <CardContent
        sx={{
          p: 2.25,
          pb: '18px !important',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flexGrow: 1,
        }}
      >
        {/* Header: title + subtle monochrome icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              fontSize: '0.8125rem',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}
          >
            {metric.title}
          </Typography>

          {icon && (
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.035)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`,
                color: theme.palette.text.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                '& svg': { fontSize: 17 },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {/* Primary numeric value - Apple SF Pro bold tabular numbers */}
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.875rem', sm: '2.125rem' },
            letterSpacing: '-0.035em',
            color: theme.palette.text.primary,
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            mt: 1.5,
            mb: progressValue !== null ? 1 : 0.75,
          }}
        >
          {metric.value}
        </Typography>

        {/* Apple-style thin monochrome progress bar (for Attendance Rate) */}
        {progressValue !== null && (
          <Box sx={{ mb: 1.25 }}>
            <Box
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.09)'
                  : 'rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  width: `${progressValue}%`,
                  backgroundColor: isDark ? '#F1F5F9' : '#0F172A',
                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </Box>
          </Box>
        )}

        {/* Footer: context / subtitle and clean change indicator */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 'auto',
            pt: 0.5,
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: theme.palette.text.secondary,
              fontWeight: 400,
              lineHeight: 1.3,
            }}
          >
            {metric.subtitle || metric.period}
          </Typography>

          {metric.change !== undefined && (
            <Typography
              component="span"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: theme.palette.text.secondary,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.25,
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}
            >
              {metric.change >= 0 ? '+' : ''}{metric.change}%
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
