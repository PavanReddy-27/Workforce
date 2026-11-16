import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context';

interface MfaSetupDialogProps {
  open: boolean;
  onClose: () => void;
}

export const MfaSetupDialog: React.FC<MfaSetupDialogProps> = ({ open, onClose }) => {
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState<'init' | 'scan' | 'complete' | 'disabled'>('init');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [disablePassword, setDisablePassword] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);

  const handleStartSetup = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authService.setupMfa();
      if (res.success && res.data) {
        setQrCodeUrl(res.data.qrCodeUrl);
        setSecret(res.data.secret);
        setStep('scan');
      }
    } catch (err) {
      const e = err as { message?: string };
      setErrorMsg(e.message || 'Failed to initiate MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authService.confirmMfa(verifyCode.trim());
      if (res.success && res.data) {
        setBackupCodes(res.data.backupCodes);
        await refreshUser();
        setStep('complete');
      }
    } catch (err) {
      const e = err as { message?: string };
      setErrorMsg(e.message || 'Invalid verification code. Please check your app.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!disablePassword) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authService.disableMfa(disablePassword);
      if (!res.success || res.data?.mfa_enabled !== false) {
        throw new Error('The server did not confirm that MFA was disabled. Please try again.');
      }
      await refreshUser();
      setDisablePassword('');
      setStep('disabled');
    } catch (err) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleClose = () => {
    setStep('init');
    setVerifyCode('');
    setDisablePassword('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
        <ShieldOutlinedIcon color="primary" />
        {user?.mfa_enabled ? 'Google Authenticator settings' : 'Set up Google Authenticator'}
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {user?.mfa_enabled && step === 'init' ? (
          <Box component="form" onSubmit={handleDisable} sx={{ py: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CheckCircleOutlinedIcon color="success" sx={{ fontSize: 56, mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Google Authenticator is Active
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Your account is secured with a time-based authenticator code at sign-in.
              </Typography>
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Disable two-factor authentication
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Confirm your password to remove the authenticator requirement for this account.
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="password"
              label="Current password"
              autoComplete="current-password"
              value={disablePassword}
              onChange={(event) => setDisablePassword(event.target.value)}
              disabled={loading}
              required
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="outlined"
              color="error"
              disabled={loading || !disablePassword}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {loading ? 'Disabling...' : 'Disable MFA'}
            </Button>
          </Box>
        ) : step === 'disabled' ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleOutlinedIcon color="success" sx={{ fontSize: 56, mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Two-factor authentication disabled
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You can sign in with your password. You can enable an authenticator again at any time.
            </Typography>
          </Box>
        ) : step === 'init' ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <QrCode2Icon color="primary" sx={{ fontSize: 56, mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Enable Google Authenticator
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, maxWidth: 420, mx: 'auto' }}>
              Protect your account by requiring a Google Authenticator code each time you sign in. Other apps that support standard TOTP codes can also scan the QR code.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Make sure your phone’s date and time are set automatically for codes to work.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartSetup}
              disabled={loading}
              sx={{ mt: 3, fontWeight: 600 }}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ShieldOutlinedIcon />}
            >
              Begin MFA Setup
            </Button>
          </Box>
        ) : step === 'scan' ? (
          <Box component="form" onSubmit={handleVerify}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Step 1: Scan this QR code with Google Authenticator
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              {qrCodeUrl && (
                <Box
                  component="img"
                  src={qrCodeUrl}
                  alt="Google Authenticator setup QR code"
                  sx={{
                    width: 200,
                    height: 200,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 1,
                    backgroundColor: '#fff',
                  }}
                />
              )}
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mb: 1 }}>
              Or enter this setup key manually in Google Authenticator:
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 3,
                backgroundColor: 'action.hover',
                py: 1,
                px: 2,
                borderRadius: 1.5,
              }}
            >
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {secret}
              </Typography>
              <Tooltip title={copiedSecret ? 'Copied!' : 'Copy key'}>
                <IconButton size="small" onClick={handleCopySecret}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Step 2: Enter the 6-digit code from Google Authenticator
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. 123456"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              disabled={loading}
              autoFocus
              sx={{ mb: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || verifyCode.trim().length < 6}
              sx={{ fontWeight: 600, py: 1 }}
            >
              {loading ? 'Verifying...' : 'Verify and Enable MFA'}
            </Button>
          </Box>
        ) : (
          <Box sx={{ py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', mb: 2 }}>
              <CheckCircleOutlinedIcon />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Google Authenticator Successfully Enabled
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Save these one-time backup codes in a safe place. If you ever lose access to your phone or authenticator app, each code can be used once to log in.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.5,
                p: 2,
                backgroundColor: 'action.hover',
                borderRadius: 2,
                mb: 2,
              }}
            >
              {backupCodes.map((code) => (
                <Chip
                  key={code}
                  label={code}
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                />
              ))}
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyBackupCodes}
              sx={{ mb: 1 }}
            >
              {copiedBackup ? 'Backup Codes Copied!' : 'Copy All Backup Codes'}
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined" size="small">
          {step === 'complete' || step === 'disabled' ? 'Done' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
