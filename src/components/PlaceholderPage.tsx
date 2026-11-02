/**
 * Placeholder Page Component
 * Polished "Coming Soon" section for under-construction features.
 * Displays a hero icon, feature badges, and an illustrative progress indicator.
 */

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  alpha,
  useTheme,
  LinearProgress,
} from '@mui/material';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
  features?: string[];
  completionPercent?: number;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  icon,
  color = '#6366F1',
  features = [],
  completionPercent = 0,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 480,
        textAlign: 'center',
        py: 6,
        px: 3,
      }}
    >
      {/* Hero Icon */}
      <Box
        sx={{
          position: 'relative',
          mb: 3.5,
        }}
      >
        {/* Outer glow ring */}
        <Box
          sx={{
            position: 'absolute',
            inset: -12,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(color, isDark ? 0.15 : 0.1)} 0%, transparent 70%)`,
          }}
        />
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: '22px',
            backgroundColor: alpha(color, isDark ? 0.18 : 0.1),
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            border: `1.5px solid ${alpha(color, isDark ? 0.25 : 0.2)}`,
            boxShadow: `0 0 0 8px ${alpha(color, isDark ? 0.06 : 0.04)}, 0 8px 24px ${alpha(color, 0.15)}`,
            '& svg': { fontSize: 44 },
          }}
        >
          {icon}
        </Box>
      </Box>

      {/* Badge */}
      <Chip
        icon={<ScheduleOutlinedIcon sx={{ fontSize: '13px !important' }} />}
        label="In Development"
        size="small"
        sx={{
          mb: 2,
          fontWeight: 700,
          fontSize: '0.6875rem',
          letterSpacing: '0.04em',
          backgroundColor: alpha(color, isDark ? 0.15 : 0.08),
          color,
          border: `1px solid ${alpha(color, isDark ? 0.3 : 0.2)}`,
          '& .MuiChip-icon': { color },
        }}
      />

      {/* Title */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          letterSpacing: '-0.025em',
          mb: 1.25,
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>

      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          maxWidth: 460,
          lineHeight: 1.75,
          mb: features.length > 0 ? 3.5 : 0,
          fontSize: '0.875rem',
        }}
      >
        {description}
      </Typography>

      {/* Feature chips */}
      {features.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: 'center',
            maxWidth: 520,
            mb: 3.5,
          }}
        >
          {features.map((f, idx) => (
            <Chip
              key={f}
              label={f}
              size="small"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                borderColor: alpha(color, isDark ? 0.25 : 0.18),
                color: theme.palette.text.secondary,
                backgroundColor: alpha(color, isDark ? 0.06 : 0.04),
                animation: `fadeInUp 0.35s ease ${idx * 0.05}s both`,
              }}
              variant="outlined"
            />
          ))}
        </Box>
      )}

      {/* Optional progress indicator */}
      {completionPercent > 0 && (
        <Box sx={{ width: '100%', maxWidth: 320 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 0.75,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Development Progress
            </Typography>
            <Typography variant="caption" sx={{ color, fontWeight: 700 }}>
              {completionPercent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionPercent}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: isDark
                ? 'rgba(148, 163, 184, 0.12)'
                : 'rgba(15, 23, 42, 0.07)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.65)})`,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default PlaceholderPage;
