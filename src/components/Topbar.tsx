import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  InputBase,
  Button,
  Badge,
  Tooltip,
  Select,
  MenuItem,
  useTheme,
  alpha,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import { tokens } from '../theme/theme';

interface TopbarProps {
  mode: 'light' | 'dark';
  onToggleMode: () => void;
  onOpenMobileSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExportClick: () => void;
  onAddEmployeeClick: () => void;
  viewState?: 'normal' | 'loading' | 'empty' | 'error';
  onViewStateChange?: (state: 'normal' | 'loading' | 'empty' | 'error') => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  mode,
  onToggleMode,
  onOpenMobileSidebar,
  searchQuery,
  onSearchChange,
  onExportClick,
  onAddEmployeeClick,
  viewState = 'normal',
  onViewStateChange,
}) => {
  const theme = useTheme();
  const isDark = mode === 'dark';

  return (
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

        {/* Page title */}
        <Typography
          variant="subtitle1"
          noWrap
          sx={{ fontWeight: 600, fontSize: '0.9375rem', mr: 'auto', letterSpacing: '-0.01em' }}
        >
          Workforce Analytics
        </Typography>

        {/* Search */}
        <Box
          component="form"
          onSubmit={(e: React.FormEvent) => e.preventDefault()}
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

        {/* State simulation selector for verifying Loading, Empty, Error states */}
        {onViewStateChange && (
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 0.75 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
              State:
            </Typography>
            <Select
              size="small"
              value={viewState}
              onChange={(e) => onViewStateChange(e.target.value as 'normal' | 'loading' | 'empty' | 'error')}
              sx={{
                height: 28,
                fontSize: '0.75rem',
                borderRadius: '6px',
                color: theme.palette.text.secondary,
                '& .MuiSelect-select': { py: '2px', px: '8px' },
              }}
            >
              <MenuItem value="normal" sx={{ fontSize: '0.75rem' }}>Normal (Live)</MenuItem>
              <MenuItem value="loading" sx={{ fontSize: '0.75rem' }}>Loading State</MenuItem>
              <MenuItem value="empty" sx={{ fontSize: '0.75rem' }}>Empty State</MenuItem>
              <MenuItem value="error" sx={{ fontSize: '0.75rem' }}>Error State</MenuItem>
            </Select>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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

          <Tooltip title="Notifications" arrow>
            <IconButton size="small" sx={{ color: theme.palette.text.secondary }} aria-label="Notifications">
              <Badge variant="dot" color="primary" overlap="circular">
                <NotificationsNoneOutlinedIcon sx={{ fontSize: 18 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Export CSV Report" arrow>
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
