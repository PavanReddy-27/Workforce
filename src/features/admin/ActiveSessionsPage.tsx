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
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { authService } from '../../services/auth.service';
import type { UserSession } from '../../types';

export const ActiveSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authService.getSessions();
      if (res.success && Array.isArray(res.data)) {
        setSessions(res.data);
      }
    } catch (err) {
      const e = err as { message?: string };
      setErrorMsg(e.message || 'Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId: number) => {
    try {
      const res = await authService.revokeSession(sessionId);
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setSuccessMsg('Session terminated and revoked immediately.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      const e = err as { message?: string };
      setErrorMsg(e.message || 'Failed to revoke session');
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
            Session Management & Active Devices
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Review signed-in devices and terminate compromised or abandoned sessions.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchSessions}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {successMsg}
        </Alert>
      )}

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
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Device / User-Agent</TableCell>
              <TableCell>Last Activity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No active sessions found.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {session.username || `User #${session.user_id}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {session.user_email}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {session.ip_address || '127.0.0.1'}
                  </TableCell>

                  <TableCell sx={{ maxWidth: 260 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DevicesOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography
                        variant="caption"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'text.secondary',
                        }}
                      >
                        {session.user_agent || 'Mozilla Web Browser'}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell sx={{ fontSize: '0.8125rem' }}>
                    {formatDate(session.last_activity_at)}
                  </TableCell>

                  <TableCell>
                    <Chip
                      icon={<CheckCircleIcon sx={{ '&&': { fontSize: 14 } }} />}
                      label={session.is_active ? 'Active' : 'Revoked'}
                      size="small"
                      color={session.is_active ? 'success' : 'default'}
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Terminate Session">
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutlinedIcon />}
                        onClick={() => handleRevoke(session.id)}
                        sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25 }}
                      >
                        Revoke
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
