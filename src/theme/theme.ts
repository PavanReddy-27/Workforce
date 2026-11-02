import { createTheme, type Theme, type PaletteMode } from '@mui/material';

/**
 * Design Tokens — centralized semantic sizing, spacing, and palette anchors.
 * All components reference these constants instead of scattering magic values.
 */
export const tokens = {
  sidebar: { width: 248, collapsedWidth: 68 },
  header: { height: 56 },
  radius: { xs: 4, sm: 6, md: 8, lg: 12, xl: 16 },
  spacing: { page: 24, section: 20, card: 16, dense: 12 },
  transition: {
    fast: 'all 0.12s ease',
    base: 'all 0.2s ease',
    slow: 'all 0.35s ease',
  },
} as const;

/**
 * Palette definitions used for themed overrides and chart color palettes.
 */
export const palette = {
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  emerald: { 400: '#4ADE80', 500: '#22C55E', 600: '#16A34A' },
  amber: { 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706' },
  red: { 400: '#F87171', 500: '#EF4444', 600: '#DC2626' },
  violet: { 400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED' },
  pink: { 400: '#F472B6', 500: '#EC4899', 600: '#DB2777' },
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
} as const;

/**
 * Chart color palette — 6-color sequential scale matching the brand palette.
 */
export const CHART_COLORS = [
  palette.blue[500],
  '#0284C7',
  palette.emerald[500],
  palette.amber[500],
  palette.pink[500],
  palette.violet[500],
] as const;

export const createAppTheme = (mode: PaletteMode): Theme => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: palette.blue[500],
        light: palette.blue[400],
        dark: palette.blue[600],
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: palette.slate[500],
        light: palette.slate[400],
        dark: palette.slate[600],
        contrastText: '#FFFFFF',
      },
      success: {
        main: palette.emerald[500],
        light: palette.emerald[400],
        dark: palette.emerald[600],
      },
      warning: {
        main: palette.amber[500],
        light: palette.amber[400],
        dark: palette.amber[600],
      },
      error: {
        main: palette.red[500],
        light: palette.red[400],
        dark: palette.red[600],
      },
      info: {
        main: palette.blue[500],
        light: palette.blue[400],
        dark: palette.blue[600],
      },
      background: {
        default: isDark ? palette.slate[900] : palette.slate[100],
        paper: isDark ? palette.slate[800] : '#FFFFFF',
      },
      text: {
        primary: isDark ? palette.slate[100] : palette.slate[900],
        secondary: isDark ? palette.slate[400] : palette.slate[500],
        disabled: isDark ? palette.slate[600] : palette.slate[300],
      },
      divider: isDark
        ? `rgba(148, 163, 184, 0.12)`
        : `rgba(15, 23, 42, 0.08)`,
      action: {
        hover: isDark
          ? 'rgba(248, 250, 252, 0.04)'
          : 'rgba(15, 23, 42, 0.03)',
        selected: isDark
          ? 'rgba(59, 130, 246, 0.12)'
          : 'rgba(59, 130, 246, 0.08)',
      },
    },

    typography: {
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      h4: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 },
      h5: { fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.3 },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 500, fontSize: '0.9375rem', letterSpacing: '-0.005em' },
      subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
      body1: { fontSize: '0.875rem', lineHeight: 1.55 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
      caption: { fontSize: '0.75rem', lineHeight: 1.4, letterSpacing: '0.01em' },
      overline: { fontSize: '0.6875rem', letterSpacing: '0.06em', fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    },

    shape: {
      borderRadius: 8,
    },

    components: {
      /* ─── Global Reset ─────────────────────────── */
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isDark
              ? `${palette.slate[700]} ${palette.slate[900]}`
              : `${palette.slate[300]} ${palette.slate[100]}`,
          },
          '*, *::before, *::after': {
            transition:
              'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
          },
        },
      },

      /* ─── Paper ─────────────────────────────────── */
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },

      /* ─── Card ──────────────────────────────────── */
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.1)' : palette.slate[200]}`,
            boxShadow: isDark
              ? '0 1px 3px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.25)'
              : '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
            overflow: 'visible',
          },
        },
        defaultProps: { elevation: 0 },
      },

      /* ─── Button ────────────────────────────────── */
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 7,
            padding: '6px 14px',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
            '&:active': { transform: 'scale(0.98)' },
          },
          contained: {
            '&:hover': {
              boxShadow: isDark
                ? '0 4px 12px rgba(59, 130, 246, 0.35)'
                : '0 4px 12px rgba(59, 130, 246, 0.25)',
            },
          },
          sizeSmall: { padding: '5px 12px', fontSize: '0.8125rem' },
        },
      },

      /* ─── IconButton ────────────────────────────── */
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 7,
            '&:active': { transform: 'scale(0.92)' },
            transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.1s ease',
          },
        },
      },

      /* ─── Chip ──────────────────────────────────── */
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.75rem',
          },
        },
      },

      /* ─── Tooltip ───────────────────────────────── */
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? palette.slate[700] : palette.slate[800],
            color: palette.slate[100],
            fontSize: '0.75rem',
            fontWeight: 500,
            borderRadius: 6,
            padding: '6px 10px',
          },
          arrow: {
            color: isDark ? palette.slate[700] : palette.slate[800],
          },
        },
      },

      /* ─── TextField ─────────────────────────────── */
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 7,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : palette.slate[200],
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(148, 163, 184, 0.35)' : palette.slate[300],
            },
          },
        },
      },

      /* ─── Select ────────────────────────────────── */
      MuiSelect: {
        styleOverrides: {
          root: { borderRadius: 7 },
        },
      },

      /* ─── Table ─────────────────────────────────── */
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: isDark
              ? 'rgba(148, 163, 184, 0.08)'
              : 'rgba(15, 23, 42, 0.06)',
            padding: '10px 16px',
          },
          head: {
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: isDark ? palette.slate[400] : palette.slate[500],
            backgroundColor: isDark
              ? 'rgba(15, 23, 42, 0.4)'
              : 'rgba(241, 245, 249, 0.8)',
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.12s ease',
            '&:hover': {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.02)'
                : 'rgba(15, 23, 42, 0.015)',
            },
          },
        },
      },

      /* ─── Tabs ──────────────────────────────────── */
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.8125rem',
            minHeight: 40,
          },
        },
      },

      /* ─── Dialog ────────────────────────────────── */
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.1)' : palette.slate[200]}`,
          },
        },
      },

      /* ─── LinearProgress ────────────────────────── */
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: isDark
              ? 'rgba(148, 163, 184, 0.12)'
              : palette.slate[200],
          },
        },
      },

      /* ─── Skeleton ──────────────────────────────── */
      MuiSkeleton: {
        defaultProps: { animation: 'wave' },
        styleOverrides: {
          root: { borderRadius: 6 },
        },
      },

      /* ─── Alert ─────────────────────────────────── */
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },

      /* ─── AppBar ────────────────────────────────── */
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
    },
  });
};

export default createAppTheme;
