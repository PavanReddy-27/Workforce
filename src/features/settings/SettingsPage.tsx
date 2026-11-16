import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
} from '@mui/material';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import { ChangePasswordDialog, MfaSetupDialog } from '../auth';
import { useAuth } from '../../context';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [mfaDialogOpen, setMfaDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Manage your account security and sign-in preferences.
      </Typography>

      <Box
        sx={{
          width: '100%',
          maxWidth: 1040,
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Card variant="outlined">
          <CardContent
            sx={{
              height: '100%',
              boxSizing: 'border-box',
              p: { xs: 2, sm: 2.5 },
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              '&:last-child': { pb: { xs: 2, sm: 2.5 } },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'flex-start',
              }}
            >
              <SecurityOutlinedIcon color="primary" sx={{ mt: 0.25, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Google Authenticator
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Require a one-time authenticator code when you sign in. Compatible TOTP apps can also scan the setup QR code.
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                mt: 'auto',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label={user?.mfa_enabled ? 'Enabled' : 'Not enabled'}
                color={user?.mfa_enabled ? 'success' : 'default'}
                size="small"
                variant={user?.mfa_enabled ? 'filled' : 'outlined'}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              />
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setMfaDialogOpen(true)}
                sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: 40 }}
              >
                {user?.mfa_enabled ? 'Manage MFA' : 'Set up'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent
            sx={{
              height: '100%',
              boxSizing: 'border-box',
              p: { xs: 2, sm: 2.5 },
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              '&:last-child': { pb: { xs: 2, sm: 2.5 } },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'flex-start',
              }}
            >
              <LockResetOutlinedIcon color="primary" sx={{ mt: 0.25, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Change your password to keep your account secure.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 'auto' }}>
              <Button
                variant="outlined"
                startIcon={<LockResetOutlinedIcon />}
                fullWidth
                onClick={() => setPasswordDialogOpen(true)}
                sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: 40 }}
              >
                Change password
              </Button>
              <Alert severity="info" sx={{ mt: 2 }}>
                Changing your password ends all active sessions, including this one.
              </Alert>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <MfaSetupDialog
        open={mfaDialogOpen}
        onClose={() => setMfaDialogOpen(false)}
      />
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        onSuccess={() => setPasswordDialogOpen(false)}
      />
    </Box>
  );
};
