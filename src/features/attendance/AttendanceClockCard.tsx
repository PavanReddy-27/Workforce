import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { attendanceService } from '../../services';
import type { BackendAttendanceRecord } from '../../types';
import { formatAttendanceTime } from '../../utils';

interface AttendanceClockCardProps {
  onAttendanceChanged?: () => void;
}

function getUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const AttendanceClockCard: React.FC<AttendanceClockCardProps> = ({ onAttendanceChanged }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [record, setRecord] = useState<BackendAttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadToday = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await attendanceService.getAttendance(
        { date: getUtcDate(), page: 1, limit: 1 },
        { signal }
      );
      if (!response.success) {
        throw new Error(response.message || 'Unable to load today’s attendance.');
      }
      setRecord(response.data[0] ?? null);
    } catch (requestError) {
      if (signal?.aborted) return;
      setError(requestError instanceof Error ? requestError.message : 'Unable to load today’s attendance.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadToday(controller.signal);
    return () => controller.abort();
  }, [loadToday]);

  const clockIn = !record?.check_in_time;
  const clockedOut = Boolean(record?.check_out_time);
  const onLeave = record?.status === 'On Leave';
  const canClockIn = clockIn && !onLeave;
  const canClockOut = Boolean(record?.check_in_time) && !clockedOut;

  const handleClock = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = clockIn
        ? await attendanceService.clockIn()
        : await attendanceService.clockOut();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Unable to save your attendance.');
      }
      setRecord(response.data);
      setNotice(clockIn ? 'You’re clocked in. Have a great day!' : 'You’re clocked out for today.');
      onAttendanceChanged?.();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save your attendance.');
      await loadToday();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#1D4ED8', 0.22)}, ${theme.palette.background.paper} 70%)`
          : `linear-gradient(135deg, ${alpha('#DBEAFE', 0.72)}, #FFFFFF 72%)`,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
        <Stack spacing={2} sx={{ height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">TODAY’S ATTENDANCE · UTC</Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {new Intl.DateTimeFormat(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'UTC',
                }).format(new Date())}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                display: 'grid',
                placeItems: 'center',
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1),
              }}
            >
              <AccessTimeOutlinedIcon />
            </Box>
          </Box>

          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {notice && <Alert severity="success" onClose={() => setNotice(null)}>{notice}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Clock in (UTC)</Typography>
                  <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {formatAttendanceTime(record?.check_in_time ?? null)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Clock out (UTC)</Typography>
                  <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {formatAttendanceTime(record?.check_out_time ?? null)}
                  </Typography>
                </Box>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 'auto', flexWrap: 'wrap', alignItems: 'center' }}
              >
                <Button
                  variant="contained"
                  onClick={handleClock}
                  disabled={saving || (!canClockIn && !canClockOut)}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlinedIcon />}
                  sx={{ minWidth: 150 }}
                >
                  {saving ? 'Saving…' : canClockIn ? 'Clock in' : canClockOut ? 'Clock out' : 'Day complete'}
                </Button>
                {onLeave && <Chip size="small" color="warning" label="On leave" />}
                {clockedOut && <Chip size="small" color="success" label="Complete" />}
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
