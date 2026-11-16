import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import PolicyOutlinedIcon from '@mui/icons-material/PolicyOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { authService } from '../../services/auth.service';
import type { AuditLog } from '../../types';

const ACTION_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  LOGIN_SUCCESS: 'success',
  AUTH_LOGOUT: 'default',
  ACCOUNT_LOCKED: 'error',
  LOGIN_LOCKED_ATTEMPT: 'error',
  TOKEN_REUSE_DETECTED: 'error',
  MFA_ENABLED: 'success',
  MFA_DISABLED: 'warning',
  MFA_BACKUP_CODE_USED: 'info',
  PASSWORD_CHANGED: 'info',
  USER_CREATED: 'primary',
  ROLE_CHANGED: 'warning',
  USER_ACTIVATED: 'success',
  USER_DEACTIVATED: 'error',
  SESSION_REVOKED: 'default',
};

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Record<string, unknown> | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authService.getAuditLogs(1, 100);
      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err) {
      const e = err as { message?: string };
      setErrorMsg(e.message || 'Failed to retrieve audit events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            Security & Audit Logs
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Immutable trace of authentication, authorization changes, and critical security events.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchLogs}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Security Event</TableCell>
              <TableCell>User</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell align="right">Payload</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No audit logs recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                let parsedDetails: Record<string, unknown> | null = null;
                if (log.details) {
                  try {
                    parsedDetails = JSON.parse(log.details);
                  } catch {
                    parsedDetails = { raw: log.details };
                  }
                }

                return (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {formatDate(log.created_at)}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color={ACTION_COLORS[log.action] || 'default'}
                        variant="filled"
                        sx={{ fontWeight: 600, fontSize: '0.7rem', height: 24 }}
                      />
                    </TableCell>

                    <TableCell>
                      {log.username ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                            {log.username}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {log.user_email}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          System / Anonymous
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {log.ip_address || '127.0.0.1'}
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {log.resource_type.toUpperCase()}
                        {log.resource_id ? ` #${log.resource_id}` : ''}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      {parsedDetails ? (
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<InfoOutlinedIcon />}
                          onClick={() => setSelectedDetails(parsedDetails)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          View Details
                        </Button>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog open={Boolean(selectedDetails)} onClose={() => setSelectedDetails(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <PolicyOutlinedIcon color="primary" />
          Event Payload Details
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component="pre"
            sx={{
              p: 2,
              backgroundColor: 'action.hover',
              borderRadius: 2,
              fontFamily: 'monospace',
              fontSize: '0.825rem',
              overflowX: 'auto',
              m: 0,
            }}
          >
            {JSON.stringify(selectedDetails, null, 2)}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setSelectedDetails(null)} size="small" variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
