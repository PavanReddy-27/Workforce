import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  InputBase,
  Button,
  Tooltip,
  useTheme,
  alpha,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { tokens } from '../theme/theme';
import { useAuth } from '../context';
import type { UserRole } from '../types';

interface TopbarProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
  onOpenMobileSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExportClick: () => void;
  onAddEmployeeClick: () => void;
}

const ROLE_COLORS: Record<UserRole, 'error' | 'primary' | 'warning' | 'info' | 'default'> = {
  admin: 'error',
  hr: 'primary',
  manager: 'warning',
  team_lead: 'info',
  employee: 'default',
};

export const Topbar: React.FC<TopbarProps> = ({
  mode,
  onToggleMode,
  onOpenMobileSidebar,
  searchQuery,
  onSearchChange,
  onExportClick,
  onAddEmployeeClick,
}) => {
  const theme = useTheme();
  const isDark = mode === 'dark';
  const { user, role, logout, hasPermission } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const canExport = hasPermission('export:data');
  const canCreateEmployee = hasPermission('employees:create');
  const canSearchEmployees =
    hasPermission('employees:read_all') || hasPermission('employees:read_dept');

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const displayName = user?.employee_details
    ? `${user.employee_details.first_name} ${user.employee_details.last_name}`
    : user?.username || 'User';

  const userRole = role || 'employee';

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: isDark ? alpha('#1E293B', 0.95) : alpha('#FFFFFF', 0.95),
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${tokens.header.height}px !important`,
            height: tokens.header.height,
            px: { xs: 1.5, md: 2.5 },
            gap: 1.5,
          }}
        >
          {/* Mobile menu */}
          <IconButton
            onClick={onOpenMobileSidebar}
            edge="start"
            size="small"
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              color: theme.palette.text.primary,
            }}
            aria-label="Open navigation menu"
          >
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>

          {/* Page title with active role pill */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 'auto' }}>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{ fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}
            >
              {userRole === 'employee' ? 'My Workforce' : 'Workforce Analytics'}
            </Typography>
            <Chip
              label={userRole.toUpperCase()}
              size="small"
              color={ROLE_COLORS[userRole]}
              variant="outlined"
              sx={{ height: 22, fontSize: '0.675rem', fontWeight: 700 }}
            />
          </Box>

          {/* Search bar */}
          {canSearchEmployees && (
            <Box
              component="form"
              onSubmit={(e: React.SubmitEvent) => e.preventDefault()}
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                maxWidth: 240,
                width: '100%',
                px: 1.25,
                py: 0.35,
                borderRadius: '6px',
                backgroundColor: isDark ? alpha('#FFFFFF', 0.05) : alpha('#0F172A', 0.04),
                border: `1px solid transparent`,
                transition: 'border-color 0.15s ease',
                '&:focus-within': {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 0.75, fontSize: 17 }} />
              <InputBase
                placeholder="Search employee or role..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                inputProps={{ 'aria-label': 'Search employee or role' }}
                sx={{ fontSize: '0.8125rem', width: '100%', color: theme.palette.text.primary }}
              />
              {searchQuery && (
                <IconButton size="small" onClick={() => onSearchChange('')} sx={{ p: 0.25 }} aria-label="Clear search">
                  <ClearIcon sx={{ fontSize: 13 }} />
                </IconButton>
              )}
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Tooltip title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'} arrow>
              <IconButton
                onClick={onToggleMode}
                size="small"
                sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.text.primary } }}
                aria-label="Toggle theme"
              >
                {isDark ? <LightModeOutlinedIcon sx={{ fontSize: 18 }} /> : <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>

            {/* Export CSV (Only for Admin & HR) */}
            {canExport && (
              <Tooltip title="Export CSV Report (Admin & HR)" arrow>
                <IconButton
                  onClick={onExportClick}
                  size="small"
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    color: theme.palette.text.secondary,
                  }}
                  aria-label="Export report"
                >
                  <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}

            {/* Add Employee (Only for Admin & HR) */}
            {canCreateEmployee && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: '15px !important' }} />}
                onClick={onAddEmployeeClick}
                sx={{
                  ml: 0.5,
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  height: 32,
                  px: 1.5,
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              >
                Add Employee
              </Button>
            )}

            {/* User Profile Avatar Menu */}
            <Tooltip title="Account Settings & Role Switcher">
              <IconButton onClick={handleOpenMenu} size="small" sx={{ ml: 0.5, p: 0.5 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: `${ROLE_COLORS[userRole]}.main`,
                    color: '#FFF',
                  }}
                >
                  {displayName.slice(0, 2).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile & Security Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              minWidth: 240,
              borderRadius: 2,
              mt: 1,
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {displayName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {user?.email}
          </Typography>
          <Box sx={{ mt: 0.75, display: 'flex', gap: 0.5 }}>
            <Chip
              label={userRole.toUpperCase()}
              size="small"
              color={ROLE_COLORS[userRole]}
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
            />
            {user?.mfa_enabled && (
              <Chip
                label="2FA Active"
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            )}
          </Box>
        </Box>

        <Divider />

        <MenuItem onClick={logout} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign Out" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default Topbar;
