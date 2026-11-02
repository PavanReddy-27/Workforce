/**
 * Placeholder Page Component
 * Indicates that a navigation section is outside the current release scope.
 */

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  icon,
  color = '#6366F1',
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
        label="Not in this release"
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
          mb: 0,
          fontSize: '0.875rem',
        }}
      >
        {description}
      </Typography>

    </Box>
  );
};

export default PlaceholderPage;
