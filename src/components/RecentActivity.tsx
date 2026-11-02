import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import type { ActivityItem } from '../types';

interface RecentActivityProps {
  activities: ActivityItem[];
  onViewAll?: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities, onViewAll }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '6px',
                backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1),
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HistoryToggleOffOutlinedIcon sx={{ fontSize: 17 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.2 }}>
                Recent Hires
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Latest employee hire dates from the directory
              </Typography>
            </Box>
          </Box>

          <Button
            size="small"
            variant="text"
            endIcon={<ArrowForwardIosIcon sx={{ fontSize: '10px !important' }} />}
            onClick={onViewAll}
            sx={{
              fontWeight: 500,
              fontSize: '0.75rem',
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.primary.main },
            }}
          >
            Employee Directory
          </Button>
        </Box>

        {/* Activity Items List: scrollable container balanced with department chart */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            maxHeight: 335,
            overflowY: 'auto',
            pr: 0.5,
          }}
        >
          {activities.length === 0 ? (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, py: 6, textAlign: 'center' }}>
              No recent events matching this filter.
            </Typography>
          ) : (
            activities.map((act) => {
              const initials = act.employeeName
                .split(' ')
                .map((n) => n[0])
                .join('');

              return (
                <Box
                  key={act.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    p: 1.25,
                    borderRadius: '6px',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'}`,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.015)' : '#FAFAFA',
                    gap: 1.5,
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                      borderColor: theme.palette.divider,
                    },
                  }}
                >
                  {/* Left: Avatar + Two-line Detail Hierarchy */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, minWidth: 0, flexGrow: 1 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: alpha('#10B981', isDark ? 0.2 : 0.12),
                        color: '#10B981',
                        border: `1px solid ${alpha('#10B981', 0.25)}`,
                        mt: 0.25,
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </Avatar>

                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      {/* Top line: Name + Chip Badge + Department */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          {act.employeeName}
                        </Typography>
                        <Chip
                          icon={<PersonAddAlt1OutlinedIcon sx={{ fontSize: 13 }} />}
                          label="New Hire"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            backgroundColor: alpha('#10B981', isDark ? 0.2 : 0.1),
                            color: '#10B981',
                            borderRadius: '4px',
                            '& .MuiChip-icon': {
                              color: '#10B981',
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.text.secondary, fontSize: '0.6875rem' }}
                        >
                          • {act.department}
                        </Typography>
                      </Box>

                      {/* Second line: Role and Description (No awkward truncation) */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          mt: 0.35,
                          fontSize: '0.75rem',
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                        }}
                      >
                        <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>
                          {act.role}
                        </Box>
                        {' — '}
                        {act.description}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right: Hire date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, pt: 0.25 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 400,
                        fontSize: '0.6875rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {act.hireDate}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
