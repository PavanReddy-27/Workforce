import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Button,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import FlightTakeoffOutlinedIcon from '@mui/icons-material/FlightTakeoffOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import type { ActivityItem } from '../data/mockData';

interface RecentActivityProps {
  activities: ActivityItem[];
  onViewAll?: () => void;
}

const getActivityBadge = (type: ActivityItem['type']) => {
  switch (type) {
    case 'hire':
      return {
        label: 'New Hire',
        color: '#10B981',
        icon: <PersonAddAlt1OutlinedIcon sx={{ fontSize: 13 }} />,
      };
    case 'promotion':
      return {
        label: 'Promotion',
        color: '#2563EB',
        icon: <TrendingUpOutlinedIcon sx={{ fontSize: 13 }} />,
      };
    case 'transfer':
      return {
        label: 'Transfer',
        color: '#0284C7',
        icon: <SyncAltOutlinedIcon sx={{ fontSize: 13 }} />,
      };
    case 'leave':
      return {
        label: 'Leave',
        color: '#D97706',
        icon: <FlightTakeoffOutlinedIcon sx={{ fontSize: 13 }} />,
      };
    case 'anniversary':
      return {
        label: 'Milestone',
        color: '#7C3AED',
        icon: <CakeOutlinedIcon sx={{ fontSize: 13 }} />,
      };
    default:
      return {
        label: 'Event',
        color: '#64748B',
        icon: <HistoryToggleOffOutlinedIcon sx={{ fontSize: 13 }} />,
      };
  }
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities, onViewAll }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tabIndex, setTabIndex] = useState(0);

  const filterType =
    tabIndex === 0
      ? 'all'
      : tabIndex === 1
      ? 'hire'
      : tabIndex === 2
      ? 'promotion'
      : 'leave';

  const filteredActivities =
    filterType === 'all'
      ? activities
      : activities.filter((a) => a.type === filterType);

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
                Recent Employee Activity
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Personnel movements, onboarding, and status log
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
            Audit Log
          </Button>
        </Box>

        {/* Filter Tabs */}
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          sx={{
            minHeight: 32,
            mb: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              minHeight: 32,
              py: 0.25,
              px: 1.25,
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'none',
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 600,
              },
            },
          }}
        >
          <Tab label="All Events" />
          <Tab label="Hires" />
          <Tab label="Promotions" />
          <Tab label="Leaves" />
        </Tabs>

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
          {filteredActivities.length === 0 ? (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, py: 6, textAlign: 'center' }}>
              No recent events matching this filter.
            </Typography>
          ) : (
            filteredActivities.map((act) => {
              const badge = getActivityBadge(act.type);
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
                        backgroundColor: alpha(badge.color, isDark ? 0.2 : 0.12),
                        color: badge.color,
                        border: `1px solid ${alpha(badge.color, 0.25)}`,
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
                          icon={badge.icon}
                          label={badge.label}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            backgroundColor: alpha(badge.color, isDark ? 0.2 : 0.1),
                            color: badge.color,
                            borderRadius: '4px',
                            '& .MuiChip-icon': {
                              color: badge.color,
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

                  {/* Right: Timestamp and options (never squeezed or truncated) */}
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
                      {act.timeAgo}
                    </Typography>
                    <Tooltip title="Options" arrow>
                      <IconButton size="small" sx={{ p: 0.25, color: theme.palette.text.secondary }}>
                        <MoreVertOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
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
