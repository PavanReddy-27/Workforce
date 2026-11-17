import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

interface ThemeModeToggleButtonProps {
  mode: 'light' | 'dark';
  onToggle: () => void;
}

export const ThemeModeToggleButton: React.FC<ThemeModeToggleButtonProps> = ({ mode, onToggle }) => {
  const theme = useTheme();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} arrow>
      <IconButton
        onClick={onToggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        sx={{
          color: theme.palette.text.secondary,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          '&:hover': {
            bgcolor: theme.palette.action.hover,
            color: theme.palette.text.primary,
          },
        }}
      >
        {isDark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
};
