import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { KpiMetric } from '../data/mockData';

interface KpiCardProps {
  metric: KpiMetric;
}

export const KpiCard: React.FC<KpiCardProps> = ({ metric }) => {
  const theme = useTheme();

  const isGoodTrend = metric.isPositive;
  const trendColor = isGoodTrend ? theme.palette.success.main : theme.palette.error.main;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          borderColor: theme.palette.primary.main,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.4)'
            : '0 2px 8px rgba(15, 23, 42, 0.06)',
        },
      }}
    >
      <CardContent sx={{ p: 2, pb: '14px !important', flexGrow: 1 }}>
        {/* Label */}
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 500,
            fontSize: '0.75rem',
            display: 'block',
            mb: 0.75,
            lineHeight: 1.3,
          }}
        >
          {metric.title}
        </Typography>

        {/* Primary value */}
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.35rem', sm: '1.5rem' },
            letterSpacing: '-0.02em',
            color: theme.palette.text.primary,
            lineHeight: 1.2,
            fontVariantNumeric: 'tabular-nums',
            mb: 1,
          }}
        >
          {metric.value}
        </Typography>

        {/* Trend row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              color: trendColor,
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {metric.change >= 0 ? (
              <ArrowUpwardIcon sx={{ fontSize: 13 }} />
            ) : (
              <ArrowDownwardIcon sx={{ fontSize: 13 }} />
            )}
            {Math.abs(metric.change)}%
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 400,
              fontSize: '0.7rem',
            }}
          >
            {metric.period}
          </Typography>
        </Box>

        {/* Secondary helper text */}
        {metric.subtitle && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: theme.palette.text.secondary,
              fontSize: '0.6875rem',
              mt: 0.5,
              opacity: 0.85,
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
