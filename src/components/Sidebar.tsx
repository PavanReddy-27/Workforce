import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  useMediaQuery,
  Divider,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { tokens } from '../theme/theme';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const DRAWER_WIDTH = tokens.sidebar.width;
const COLLAPSED_DRAWER_WIDTH = tokens.sidebar.collapsedWidth;

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_MAIN: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <DashboardOutlinedIcon /> },
  { id: 'directory', label: 'Employees', icon: <PeopleAltOutlinedIcon /> },
  { id: 'attendance', label: 'Attendance', icon: <EventAvailableOutlinedIcon /> },
  { id: 'departments', label: 'Departments', icon: <DomainOutlinedIcon /> },
  { id: 'recruitment', label: 'Recruitment', icon: <WorkOutlineOutlinedIcon /> },
  { id: 'performance', label: 'Performance', icon: <AssessmentOutlinedIcon /> },
];

const NAV_SECONDARY: NavItem[] = [
  { id: 'payroll', label: 'Payroll', icon: <AccountBalanceWalletOutlinedIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsOutlinedIcon /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  activeTab,
  onSelectTab,
  mobileOpen,
  onMobileClose,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const renderNavGroup = (items: NavItem[]) =>
    items.map((item) => {
      const isActive = activeTab === item.id;
      return (
        <ListItem key={item.id} disablePadding sx={{ mb: 0.25 }}>
          <Tooltip
            title={collapsed && !isMobile ? item.label : ''}
            placement="right"
            arrow
            disableHoverListener={!collapsed || isMobile}
          >
            <ListItemButton
              onClick={() => {
                onSelectTab(item.id);
                if (isMobile) onMobileClose();
              }}
              sx={{
                borderRadius: '6px',
                minHeight: 36,
                justifyContent: collapsed && !isMobile ? 'center' : 'initial',
                px: collapsed && !isMobile ? 1 : 1.5,
                backgroundColor: isActive
                  ? isDark ? alpha('#3B82F6', 0.12) : alpha('#3B82F6', 0.08)
                  : 'transparent',
                color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                transition: 'background-color 0.15s ease, color 0.15s ease',
                '&:hover': {
                  backgroundColor: isActive
                    ? isDark ? alpha('#3B82F6', 0.16) : alpha('#3B82F6', 0.1)
                    : alpha(theme.palette.text.primary, 0.04),
                  color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                },
              }}
            >
              {/* Thin left active indicator */}
              {isActive && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: '25%',
                    height: '50%',
                    width: 3,
                    borderRadius: '0 2px 2px 0',
                    backgroundColor: theme.palette.primary.main,
                  }}
                />
              )}
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed && !isMobile ? 0 : 1.5,
                  justifyContent: 'center',
                  color: 'inherit',
                  '& svg': { fontSize: 20 },
                }}
              >
                {item.icon}
              </ListItemIcon>
              {(!collapsed || isMobile) && (
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 600 : 400,
                        color: 'inherit',
                      }}
                    >
                      {item.label}
                    </Typography>
                  }
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      );
    });

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: isDark ? '#1E293B' : '#FFFFFF',
        borderRight: `1px solid ${theme.palette.divider}`,
        overflowX: 'hidden',
      }}
    >
      {/* Brand header */}
      <Box>
        <Box
          sx={{
            px: collapsed && !isMobile ? 1.5 : 2,
            height: tokens.header.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          }}
        >
          {collapsed && !isMobile ? (
            <Tooltip title="Stackly Workforce Analytics" placement="right" arrow>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
                onClick={onToggleCollapse}
              >
                <Box
                  component="img"
                  src="/stackly-logo.png"
                  alt="Stackly"
                  sx={{
                    height: 28,
                    width: 'auto',
                    maxWidth: 'none',
                    objectFit: 'cover',
                    objectPosition: 'left center',
                    filter: isDark ? 'brightness(1.6) contrast(1.1)' : 'none',
                  }}
                />
              </Box>
            </Tooltip>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                component="img"
                src="/stackly-logo.png"
                alt="Stackly Workforce Analytics"
                sx={{
                  height: 28,
                  width: 'auto',
                  maxWidth: 135,
                  objectFit: 'contain',
                  filter: isDark ? 'brightness(1.6) contrast(1.1)' : 'none',
                }}
              />
            </Box>
          )}

          {!isMobile && !collapsed && (
            <IconButton
              onClick={onToggleCollapse}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                width: 24,
                height: 24,
                '&:hover': { color: theme.palette.text.primary },
              }}
              aria-label="Collapse sidebar"
            >
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>

        {collapsed && !isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
            <IconButton
              onClick={onToggleCollapse}
              size="small"
              sx={{ color: theme.palette.text.secondary, width: 24, height: 24 }}
              aria-label="Expand sidebar"
            >
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        )}

        {/* Navigation */}
        <List sx={{ px: collapsed && !isMobile ? 0.75 : 1.25, pt: 1, pb: 0.5 }}>
          {renderNavGroup(NAV_MAIN)}
        </List>

        <Divider sx={{ mx: collapsed && !isMobile ? 1 : 2, my: 0.5 }} />

        <List sx={{ px: collapsed && !isMobile ? 0.75 : 1.25, pt: 0.5 }}>
          {renderNavGroup(NAV_SECONDARY)}
        </List>
      </Box>

      {/* User profile footer */}
      <Box sx={{ p: collapsed && !isMobile ? 1 : 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
            p: 0.75,
            borderRadius: '6px',
            '&:hover': {
              backgroundColor: alpha(theme.palette.text.primary, 0.04),
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: isDark ? '#334155' : '#E2E8F0',
                color: theme.palette.text.primary,
              }}
            >
              PR
            </Avatar>
            {(!collapsed || isMobile) && (
              <Box sx={{ overflow: 'hidden' }}>
                <Typography noWrap sx={{ fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.3 }}>
                  Pavan Reddy
                </Typography>
                <Typography sx={{ fontSize: '0.6875rem', color: theme.palette.text.secondary, lineHeight: 1.3 }}>
                  Developer
                </Typography>
              </Box>
            )}
          </Box>
          {(!collapsed || isMobile) && (
            <Tooltip title="Log out" arrow>
              <IconButton size="small" sx={{ color: theme.palette.text.secondary }} aria-label="Log out">
                <LogoutOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {sidebarContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            transition: 'width 0.2s ease',
          },
        }}
        open
      >
        {sidebarContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
