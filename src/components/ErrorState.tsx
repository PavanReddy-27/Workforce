import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  actionText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load workforce analytics data',
  message = 'An unexpected network error occurred while querying the telemetry service. Please check your connection or retry.',
  onRetry,
  actionText = 'Retry connection',
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
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.05)' : '#FEF2F2',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FCA5A5'}`,
        my: 3,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
          color: theme.palette.error.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <ErrorOutlineOutlinedIcon sx={{ fontSize: 26 }} />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5, color: theme.palette.text.primary }}>
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{ color: theme.palette.text.secondary, maxWidth: 460, mb: 2.5, lineHeight: 1.5 }}
      >
        {message}
      </Typography>

      {onRetry && (
        <Button
          variant="contained"
          color="error"
          size="small"
          startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
          onClick={onRetry}
          sx={{ fontWeight: 500, fontSize: '0.8125rem' }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default ErrorState;
