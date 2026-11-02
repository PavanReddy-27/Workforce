/**
 * EmptyState Component
 * Shown when filters return zero matching employee records.
 */

import React from 'react';
import { Box, Typography, Button, useTheme, alpha } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onResetFilters?: () => void;
  actionText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records match your criteria',
  message = 'Try adjusting your department, location, employment type, or search term to see matching data.',
  onResetFilters,
  actionText = 'Reset All Filters',
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        py: 9,
        px: 3,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.45)' : '#FFFFFF',
        border: `1.5px dashed ${theme.palette.divider}`,
        my: 2,
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '16px',
          backgroundColor: isDark
            ? 'rgba(148, 163, 184, 0.1)'
            : alpha(theme.palette.primary.main, 0.06),
          color: theme.palette.text.disabled,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2.5,
          '& svg': { fontSize: 32 },
        }}
      >
        <InboxOutlinedIcon />
      </Box>

      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: '1rem',
          letterSpacing: '-0.01em',
          mb: 0.75,
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          maxWidth: 420,
          mb: 3,
          lineHeight: 1.65,
        }}
      >
        {message}
      </Typography>

      {onResetFilters && (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<RestartAltIcon sx={{ fontSize: '15px !important' }} />}
          onClick={onResetFilters}
          sx={{ fontWeight: 600, fontSize: '0.8125rem', px: 2 }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
