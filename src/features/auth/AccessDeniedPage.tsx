import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { useAuth } from '../../context';

interface AccessDeniedPageProps {
  requiredRole?: string;
  requiredPermission?: string;
  onGoHome?: () => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  requiredRole,
  requiredPermission,
  onGoHome,
}) => {
  const { user } = useAuth();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 480,
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            p: 2,
            borderRadius: '50%',
            backgroundColor: 'error.light',
            color: 'error.main',
            mb: 2.5,
          }}
        >
          <GppBadOutlinedIcon sx={{ fontSize: 48 }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
          Access Restricted
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
          You do not have the required permissions to view this resource. Your current role is{' '}
          <strong>{user?.role?.toUpperCase() || 'UNKNOWN'}</strong>.
          {requiredRole && (
            <span>
              {' '}This section requires <strong>{requiredRole.toUpperCase()}</strong> privileges.
            </span>
          )}
          {requiredPermission && (
            <span>
              {' '}Missing capability: <code>{requiredPermission}</code>.
            </span>
          )}
        </Typography>

        {onGoHome && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<HomeOutlinedIcon />}
            onClick={onGoHome}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Return to Authorized Dashboard
          </Button>
        )}
      </Paper>
    </Box>
  );
};
