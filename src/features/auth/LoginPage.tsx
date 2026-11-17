import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  InputBase,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { ThemeModeToggleButton } from '../../components/ThemeModeToggleButton';
import type { Theme } from '@mui/material/styles';
import { useAuth } from '../../context';
import { authService } from '../../services/auth.service';
import type { DemoAccountFromSql } from '../../types';
import { Vault3DIllustration } from './Vault3DIllustration';
import { EmployeeLoginDialog } from './EmployeeLoginDialog';

const getRoleConfig = (role: string, theme: Theme) => {
  switch (role) {
    case 'admin':
      return {
        icon: <AdminPanelSettingsIcon sx={{ fontSize: 16 }} />,
        badgeColor: theme.palette.error.main,
      };
    case 'hr':
      return {
        icon: <BadgeOutlinedIcon sx={{ fontSize: 16 }} />,
        badgeColor: theme.palette.primary.main,
      };
    case 'manager':
      return {
        icon: <SupervisorAccountIcon sx={{ fontSize: 16 }} />,
        badgeColor: theme.palette.warning.main,
      };
    case 'team_lead':
      return {
        icon: <SupervisorAccountIcon sx={{ fontSize: 16 }} />,
        badgeColor: theme.palette.info.main,
      };
    default:
      return {
        icon: <PersonOutlinedIcon sx={{ fontSize: 16 }} />,
        badgeColor: theme.palette.text.secondary,
      };
  }
};

interface LoginPageProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ mode, onToggleMode }) => {
  const theme = useTheme();
  const { login, verifyMfa } = useAuth();
  const demoLoginEnabled = import.meta.env.DEV;

  // Form input state: initialized empty (no hardcoded prefill)
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Focus states for custom sleek inputs
  const [emailFocused, setEmailFocused] = useState<boolean>(false);
  const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
  const [mfaFocused, setMfaFocused] = useState<boolean>(false);

  // MFA Challenge State
  const [mfaPending, setMfaPending] = useState<boolean>(false);
  const [mfaToken, setMfaToken] = useState<string>('');
  const [mfaCode, setMfaCode] = useState<string>('');

  // Demo accounts loaded dynamically from the SQLite database
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountFromSql[]>([]);
  const [loadingDemoAccounts, setLoadingDemoAccounts] = useState<boolean>(true);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!demoLoginEnabled) {
      setLoadingDemoAccounts(false);
      return;
    }

    let isMounted = true;
    authService
      .getDemoAccounts()
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data)) {
          setDemoAccounts(res.data);
        }
      })
      .catch((err) => {
        console.warn('Unable to retrieve demo accounts from SQLite:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingDemoAccounts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [demoLoginEnabled]);

  const isEmailValid = email.includes('@') && email.includes('.');

  const handleStandardLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Enter your email address and password to continue.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (result.requiresMfa && result.mfaToken) {
        setMfaToken(result.mfaToken);
        setMfaPending(true);
      }
    } catch (err) {
      const e = err as { message?: string };
      setErrorMsg(e.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!mfaCode.trim()) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      await verifyMfa(mfaToken, mfaCode.trim());
    } catch (err) {
      const e = err as { message?: string };
      setErrorMsg(e.message || 'MFA verification failed. Please check your authenticator code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoAccount = (account: DemoAccountFromSql) => {
    setEmail(account.email);
    setPassword(account.defaultPassword || '');
    setErrorMsg(null);
    setMfaPending(false);
  };

  const adminAccount = demoAccounts.find((a) => a.role === 'admin');
  const hrAccount = demoAccounts.find((a) => a.role === 'hr');
  const managerAccount = demoAccounts.find((a) => a.role === 'manager');

  const primaryAccounts = demoAccounts.filter((a) => a.isSystemDemo || a.email.endsWith('@workforce.com'));
  const employeeAccounts = demoAccounts.filter((a) => !a.isSystemDemo && !a.email.endsWith('@workforce.com'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        backgroundColor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* Left Column: Form & Branding */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%', lg: '48%' },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          px: { xs: 3, sm: 6, md: 7, lg: 9 },
          py: { xs: 4, sm: 5 },
          backgroundColor: 'background.default',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        {/* Top Brand Header: Stackly Logo (matching Sidebar) */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box
            component="img"
            src="/stackly-logo.png"
            alt="Stackly Workforce Analytics"
            sx={{
              height: 36,
              width: 'auto',
              maxWidth: 160,
              objectFit: 'contain',
            }}
          />
          <ThemeModeToggleButton mode={mode} onToggle={onToggleMode} />
        </Box>

        {/* Center Main Card Content */}
        <Box
          sx={{
            width: '100%',
            maxWidth: 420,
            mx: 'auto',
            my: { xs: 4, md: 'auto' },
          }}
        >
          {/* Login Header */}
          <Box sx={{ textAlign: 'center', mb: 3.5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem' },
                color: 'text.primary',
                letterSpacing: '-0.03em',
              }}
            >
              {mfaPending ? 'Two-Factor Check' : 'Login'}
            </Typography>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
                mt: 0.75,
                fontWeight: 400,
              }}
            >
              {mfaPending
                ? 'Enter your Google Authenticator code or a one-time backup code'
                : 'Enter your details to access your account. If MFA is enabled, you will be asked for a code after your password is verified.'}
            </Typography>
          </Box>

          {/* Error Alert */}
          {errorMsg && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '12px',
                fontSize: '0.85rem',
              }}
            >
              {errorMsg}
            </Alert>
          )}

          {/* Standard Credentials Login Form */}
          {!mfaPending && (
            <Box component="form" onSubmit={handleStandardLogin} noValidate>
              {/* Email Address */}
              <Box
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  border: '1.5px solid',
                  borderColor: emailFocused ? 'primary.main' : 'divider',
                  borderRadius: '14px',
                  px: 2,
                  py: 1.1,
                  backgroundColor: 'background.paper',
                  boxShadow: emailFocused
                    ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}`
                    : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Left Envelope Icon */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    mr: 1.5,
                  }}
                >
                  <EmailOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>

                {/* Center Micro Label + Input */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: 'text.secondary',
                      textTransform: 'capitalize',
                      lineHeight: 1,
                    }}
                  >
                    Email Address
                  </Typography>
                  <InputBase
                    fullWidth
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@workforce.com"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    disabled={loading}
                    sx={{
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: 'text.primary',
                      mt: 0.2,
                      p: 0,
                    }}
                  />
                </Box>

                {/* Validation Indicator */}
                {isEmailValid && (
                  <CheckCircleRoundedIcon
                    sx={{
                      fontSize: 20,
                      color: 'success.main',
                      ml: 1,
                    }}
                  />
                )}
              </Box>

              {/* Password */}
              <Box
                sx={{
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  border: '1.5px solid',
                  borderColor: passwordFocused ? 'primary.main' : 'divider',
                  borderRadius: '14px',
                  px: 2,
                  py: 1.1,
                  backgroundColor: 'background.paper',
                  boxShadow: passwordFocused
                    ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}`
                    : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Left Lock Icon */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    mr: 1.5,
                  }}
                >
                  <LockOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>

                {/* Center Micro Label + Password Input */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: 'text.secondary',
                      textTransform: 'capitalize',
                      lineHeight: 1,
                    }}
                  >
                    Password
                  </Typography>
                  <InputBase
                    fullWidth
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter account password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    disabled={loading}
                    sx={{
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: 'text.primary',
                      mt: 0.2,
                      p: 0,
                    }}
                  />
                </Box>

                {/* Right Eye Visibility Toggle */}
                <IconButton
                  size="small"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  sx={{ color: 'text.secondary' }}
                >
                  {showPassword ? <VisibilityOff sx={{ fontSize: 19 }} /> : <Visibility sx={{ fontSize: 19 }} />}
                </IconButton>
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.4,
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '14px',
                  textTransform: 'none',
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.28)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.36)}`,
                  },
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Continue'}
              </Button>
            </Box>
          )}

          {/* MFA Challenge Screen */}
          {mfaPending && (
            <Box component="form" onSubmit={handleMfaSubmit} noValidate>
              <Box
                sx={{
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  border: '1.5px solid',
                  borderColor: mfaFocused ? 'primary.main' : 'divider',
                  borderRadius: '14px',
                  px: 2,
                  py: 1.2,
                  backgroundColor: 'background.paper',
                  boxShadow: mfaFocused ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}` : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    mr: 1.5,
                  }}
                >
                  <VpnKeyOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: 'text.secondary',
                      textTransform: 'capitalize',
                      lineHeight: 1,
                    }}
                  >
                    Google Authenticator code or backup code
                  </Typography>
                  <InputBase
                    fullWidth
                    id="mfaCode"
                    name="mfaCode"
                    autoComplete="one-time-code"
                    inputProps={{ 'aria-label': 'Authenticator or backup code' }}
                    autoFocus
                    placeholder="6-digit code or backup code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\s/g, ''))}
                    onFocus={() => setMfaFocused(true)}
                    onBlur={() => setMfaFocused(false)}
                    disabled={loading}
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color: 'text.primary',
                      mt: 0.2,
                      p: 0,
                    }}
                  />
                </Box>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.4,
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '14px',
                  textTransform: 'none',
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.28)}`,
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Confirm Identity'}
              </Button>

              <Button
                fullWidth
                variant="text"
                size="small"
                onClick={() => {
                  setMfaPending(false);
                  setMfaToken('');
                  setMfaCode('');
                  setErrorMsg(null);
                }}
                startIcon={<ArrowBackIcon />}
                sx={{ mt: 2, color: 'text.secondary', textTransform: 'none', fontSize: '0.85rem' }}
              >
                Back to Password Login
              </Button>
            </Box>
          )}

          {/* SSO Divider */}
          {!mfaPending && demoLoginEnabled && (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  my: 3,
                }}
              >
                <Box sx={{ flex: 1, height: '1px', backgroundColor: 'divider' }} />
                <Typography
                  sx={{
                    px: 2,
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                    fontWeight: 500,
                  }}
                >
                  Fill Demo Credentials
                </Typography>
                <Box sx={{ flex: 1, height: '1px', backgroundColor: 'divider' }} />
              </Box>

              {/* 3 Circular Social / SSO Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3,
                }}
              >
                {/* Google Button */}
                <Tooltip title="Fill admin demo credentials" arrow>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => {
                      if (adminAccount) handleSelectDemoAccount(adminAccount);
                    }}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      border: '1.5px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: 'text.secondary',
                        backgroundColor: 'action.hover',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  </Box>
                </Tooltip>

                {/* Apple Button */}
                <Tooltip title="Fill HR demo credentials" arrow>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => {
                      if (hrAccount) handleSelectDemoAccount(hrAccount);
                    }}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: '#000000',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: '#1e293b',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.6.69-1.12 1.83-1 2.94 1.07.08 2.15-.46 2.81-1.28z" />
                    </svg>
                  </Box>
                </Tooltip>

                {/* Microsoft / Enterprise SSO Button */}
                <Tooltip title="Fill manager demo credentials" arrow>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => {
                      if (managerAccount) handleSelectDemoAccount(managerAccount);
                    }}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: '#1877F2',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: '#1465cc',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.002C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </Box>
                </Tooltip>
              </Box>

              {/* Quick RBAC Role Selector Chips from SQLite */}
              <Box sx={{ mt: 1 }}>
                <Typography
                  sx={{
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    mb: 1,
                  }}
                >
                  Quick Role Logins (From SQLite)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.75, mb: 1.5 }}>
                  {loadingDemoAccounts ? (
                    <CircularProgress size={18} sx={{ color: 'primary.main', my: 1 }} />
                  ) : (
                    (primaryAccounts.length > 0 ? primaryAccounts : demoAccounts.slice(0, 5)).map((acc) => {
                      const isSelected = email === acc.email;
                      const config = getRoleConfig(acc.role, theme);
                      return (
                        <Tooltip key={acc.email} title={acc.description} arrow>
                          <Box
                            onClick={() => handleSelectDemoAccount(acc)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.25,
                              py: 0.4,
                              borderRadius: '9999px',
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor: isSelected ? 'primary.main' : 'divider',
                              backgroundColor: isSelected
                                ? alpha(theme.palette.primary.main, 0.12)
                                : 'background.paper',
                              color: isSelected ? 'primary.main' : 'text.secondary',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                borderColor: 'primary.main',
                                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                color: 'primary.main',
                              },
                            }}
                          >
                            <Box sx={{ color: config.badgeColor, display: 'flex' }}>
                              {config.icon}
                            </Box>
                            {acc.label}
                          </Box>
                        </Tooltip>
                      );
                    })
                  )}
                </Box>

                {/* Directory Button to browse all 37 individual employee logins */}
                {employeeAccounts.length > 0 && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setEmployeeDialogOpen(true)}
                      startIcon={<PeopleAltOutlinedIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        color: 'primary.main',
                        borderColor: 'primary.light',
                        backgroundColor: alpha(theme.palette.primary.main, 0.06),
                        borderRadius: '9999px',
                        px: 1.75,
                        py: 0.35,
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        },
                      }}
                    >
                      Browse & Log in as any of {employeeAccounts.length} Staff Members
                    </Button>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>

        {/* Footer Disclaimer */}
        <Box sx={{ mt: 'auto', pt: 3, textAlign: 'center' }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: 'text.secondary',
              lineHeight: 1.6,
              maxWidth: 420,
              mx: 'auto',
            }}
          >
            Join thousands of enterprises and leaders who trust Stackly Workforce Analytics Platform to optimize talent, manage role permissions, and secure organizational intelligence.
          </Typography>
        </Box>
      </Box>

      {/* Right Column: Hero Visual */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%', lg: '52%' },
          minHeight: { xs: 440, md: '100vh' },
          display: { xs: 'none', sm: 'flex' },
        }}
      >
        <Vault3DIllustration />
      </Box>

      {/* Employee Directory Dialog */}
      <EmployeeLoginDialog
        open={employeeDialogOpen}
        onClose={() => setEmployeeDialogOpen(false)}
        employees={employeeAccounts}
        onSelectEmployee={handleSelectDemoAccount}
      />
    </Box>
  );
};
