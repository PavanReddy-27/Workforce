import { useState, useEffect } from 'react';
import {
  Alert,
  Card,
  Box,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Typography,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { FilterState } from '../types';
import { departmentService } from '../services/departments.service';
import { employeeService } from '../services/employees.service';

const TIME_RANGES: { value: '7d' | '30d' | '90d' | '1y'; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  'All Types',
  'Active',
  'On Leave',
  'Terminated',
  'Suspended',
];

interface DashboardFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  filteredHeadcount: number;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFilterChange,
  filteredHeadcount,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [departmentOptions, setDepartmentOptions] = useState<string[]>([
    'All Departments',
  ]);
  const [locationOptions, setLocationOptions] = useState<string[]>(['All Locations']);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([departmentService.getDepartments(), employeeService.getLocations()])
      .then(([departments, locations]) => {
        if (!departments.success || !Array.isArray(departments.data)) {
          throw new Error(departments.message || 'Unable to load departments.');
        }
        if (!locations.success || !Array.isArray(locations.data)) {
          throw new Error(locations.message || 'Unable to load office locations.');
        }
        if (active) {
          setDepartmentOptions(['All Departments', ...departments.data.map((d) => d.name)]);
          setLocationOptions(['All Locations', ...locations.data]);
          setOptionsError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setOptionsError(err instanceof Error ? err.message : 'Unable to load filter options.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const isFiltered =
    filters.department !== 'All Departments' ||
    filters.location !== 'All Locations' ||
    filters.employmentType !== 'All Types' ||
    filters.timeRange !== '30d' ||
    Boolean(filters.searchQuery);

  const activeCount = [
    filters.department !== 'All Departments',
    filters.location !== 'All Locations',
    filters.employmentType !== 'All Types',
    filters.timeRange !== '30d',
    Boolean(filters.searchQuery),
  ].filter(Boolean).length;

  const handleReset = () => {
    onFilterChange({
      department: 'All Departments',
      location: 'All Locations',
      timeRange: '30d',
      employmentType: 'All Types',
      searchQuery: '',
    });
  };

  const selectSx = {
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 500,
    height: 36,
    backgroundColor: isDark ? alpha('#FFFFFF', 0.04) : '#F8FAFC',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '& .MuiSelect-select': {
      py: '7px',
      px: '12px',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
    },
  };

  return (
    <Card
      sx={{
        pt: 2.25,
        pb: 1.75,
        px: { xs: 1.5, sm: 2 },
        mb: 2.5,
        borderRadius: '8px',
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
        boxShadow: isDark
          ? '0 1px 3px rgba(0, 0, 0, 0.3)'
          : '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
      }}
    >
      {optionsError && <Alert severity="error" sx={{ mb: 1.5 }}>{optionsError}</Alert>}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 1.25,
          flexWrap: { xs: 'wrap', xl: 'nowrap' },
        }}
      >
        {/* Left Filter Controls Group */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {/* Department Filter */}
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 145 }, flexShrink: 0, mt: 0.25 }}>
            <InputLabel
              id="dept-label"
              sx={{
                fontSize: '0.8125rem',
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                px: 0.5,
              }}
            >
              Department
            </InputLabel>
            <Select
              labelId="dept-label"
              id="dept-select"
              value={filters.department}
              label="Department"
              onChange={(e) => onFilterChange({ ...filters, department: e.target.value })}
              sx={selectSx}
            >
              {departmentOptions.map((d) => (
                <MenuItem key={d} value={d} sx={{ fontSize: '0.8125rem' }}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Location Filter */}
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 135 }, flexShrink: 0, mt: 0.25 }}>
            <InputLabel
              id="loc-label"
              sx={{
                fontSize: '0.8125rem',
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                px: 0.5,
              }}
            >
              Location
            </InputLabel>
            <Select
              labelId="loc-label"
              id="loc-select"
              value={filters.location}
              label="Location"
              onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
              sx={selectSx}
            >
              {locationOptions.map((l) => (
                <MenuItem key={l} value={l} sx={{ fontSize: '0.8125rem' }}>
                  {l}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Employment Status Filter */}
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 150 }, flexShrink: 0, mt: 0.25 }}>
            <InputLabel
              id="emp-label"
              sx={{
                fontSize: '0.8125rem',
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                px: 0.5,
              }}
            >
              Employment Status
            </InputLabel>
            <Select
              labelId="emp-label"
              id="emp-select"
              value={filters.employmentType}
              label="Employment Status"
              onChange={(e) => onFilterChange({ ...filters, employmentType: e.target.value })}
              sx={selectSx}
            >
              {EMPLOYMENT_STATUS_OPTIONS.map((t) => (
                <MenuItem key={t} value={t} sx={{ fontSize: '0.8125rem' }}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Divider between dropdowns and time pills on wide screens */}
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              display: { xs: 'none', lg: 'block' },
              height: 22,
              my: 'auto',
              mx: 0.25,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
            }}
          />

          {/* Date / Time Range Pills */}
          <ToggleButtonGroup
            value={filters.timeRange}
            exclusive
            size="small"
            onChange={(_, val) => {
              if (val) onFilterChange({ ...filters, timeRange: val });
            }}
            sx={{
              backgroundColor: isDark ? alpha('#FFFFFF', 0.04) : '#F1F5F9',
              p: '2px',
              borderRadius: '6px',
              height: 36,
              mt: 0.25,
              boxSizing: 'border-box',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '4px !important',
                px: { xs: 0.75, sm: 1, md: 1.1 },
                py: 0,
                height: '100%',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                color: theme.palette.text.secondary,
                '&.Mui-selected': {
                  backgroundColor: isDark ? alpha('#FFFFFF', 0.12) : '#FFFFFF',
                  color: theme.palette.text.primary,
                  boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: isDark ? alpha('#FFFFFF', 0.16) : '#FFFFFF',
                  },
                },
              },
            }}
          >
            {TIME_RANGES.map((t) => (
              <ToggleButton key={t.value} value={t.value}>
                {t.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Right Status Group: Matching count & Reset trigger */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            ml: { md: 'auto' },
            flexShrink: 0,
          }}
        >
          {/* Matching Staff Count Badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.25,
              height: 36,
              mt: 0.25,
              borderRadius: '6px',
              backgroundColor: isDark ? alpha('#FFFFFF', 0.03) : '#F8FAFC',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
              boxSizing: 'border-box',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
            >
              Matching:{' '}
              <Box component="span" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                {filteredHeadcount.toLocaleString()}
              </Box>{' '}
              staff
            </Typography>
          </Box>

          {/* Reset Filters Action */}
          {isFiltered && (
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<RestartAltIcon sx={{ fontSize: 15 }} />}
              onClick={handleReset}
              sx={{
                height: 36,
                mt: 0.25,
                fontSize: '0.75rem',
                fontWeight: 500,
                px: 1.25,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                borderRadius: '6px',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                color: theme.palette.text.secondary,
                textTransform: 'none',
                '&:hover': {
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  backgroundColor: isDark
                    ? alpha(theme.palette.error.main, 0.1)
                    : alpha(theme.palette.error.main, 0.04),
                },
              }}
            >
              Reset ({activeCount})
            </Button>
          )}
        </Box>
      </Box>
    </Card>
  );
};

export default DashboardFilters;
