import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context';

export const AuthLoadingScreen: React.FC = () => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'background.default',
      gap: 2,
    }}
  >
    <CircularProgress size={44} color="primary" />
    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
      Loading session...
    </Typography>
  </Box>
);

export const RequireAuthentication: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

interface LoginRouteProps {
  children: React.ReactNode;
}

export const LoginRoute: React.FC<LoginRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const returnTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  if (isLoading) return <AuthLoadingScreen />;
  if (isAuthenticated) return <Navigate to={returnTo || '/'} replace />;
  return <>{children}</>;
};
