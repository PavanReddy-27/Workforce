import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import FilterListOffOutlinedIcon from '@mui/icons-material/FilterListOffOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onResetFilters?: () => void;
  actionText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No workforce records match your criteria',
  message = 'Try adjusting your department, location, employment type, or search term to see telemetry data.',
  onResetFilters,
  actionText = 'Reset all filters',
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#FFFFFF',
        border: `1px dashed ${theme.palette.divider}`,
        my: 3,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.1)' : '#F1F5F9',
          color: theme.palette.text.secondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <FilterListOffOutlinedIcon sx={{ fontSize: 24 }} />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{ color: theme.palette.text.secondary, maxWidth: 440, mb: 2.5, lineHeight: 1.5 }}
      >
        {message}
      </Typography>

      {onResetFilters && (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
          onClick={onResetFilters}
          sx={{ fontWeight: 500, fontSize: '0.8125rem' }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
