/**
 * Employee Directory & Data Table
 * Fully integrated with SQLite-backed GET /api/employees.
 * Implements:
 * - Server-side pagination (page & limit)
 * - Server-side search (first_name, last_name, employee_code, email)
 * - Server-side multi-field filters (department, location, status)
 * - Server-side sorting (asc/desc across supported fields)
 * - Debounced search input (300ms) with request cancellation
 * - Loading skeleton, Error state with retry, and Empty state
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Avatar,
  IconButton,
  Button,
  Skeleton,
  Alert,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { employeeService } from '../../services/employees.service';
import { departmentService } from '../../services/departments.service';
import type { BackendEmployee } from '../../types';

export const EmployeeTable: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Server state
  const [employees, setEmployees] = useState<BackendEmployee[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Sorting state
  const [page, setPage] = useState<number>(0); // 0-indexed for MUI
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter state
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [department, setDepartment] = useState<string>('All Departments');
  const [location, setLocation] = useState<string>('All Locations');
  const [status, setStatus] = useState<string>('All Statuses');

  // Dynamic filter options
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([
    'All Departments',
    'Engineering',
    'Product & Design',
    'Sales & Marketing',
    'Customer Success',
    'Human Resources',
    'Finance & Legal',
  ]);

  const locationOptions = [
    'All Locations',
    'San Francisco HQ',
    'London Tech Hub',
    'Singapore Office',
    'Remote Global',
  ];

  const statusOptions = ['All Statuses', 'Active', 'On Leave', 'Terminated'];

  const abortControllerRef = useRef<AbortController | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Load departments dynamically from backend
  useEffect(() => {
    let mounted = true;
    departmentService
      .getDepartments()
      .then((res) => {
        if (mounted && res.success && Array.isArray(res.data)) {
          setDepartmentOptions(['All Departments', ...res.data.map((d) => d.name)]);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Debounce search input (300ms) and reset page to 0
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when filters change
  const handleDepartmentChange = (val: string) => {
    setDepartment(val);
    setPage(0);
  };

  const handleLocationChange = (val: string) => {
    setLocation(val);
    setPage(0);
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setDepartment('All Departments');
    setLocation('All Locations');
    setStatus('All Statuses');
    setPage(0);
  };

  const handleSort = (field: string) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };

  // Fetch employees from backend API
  const fetchEmployees = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await employeeService.getEmployees(
        {
          page: page + 1, // backend is 1-indexed
          limit: rowsPerPage,
          search: debouncedSearch || undefined,
          department: department !== 'All Departments' ? department : undefined,
          location: location !== 'All Locations' ? location : undefined,
          status: status !== 'All Statuses' ? status : undefined,
          sortBy,
          sortOrder,
        },
        { signal: controller.signal }
      );

      if (res.success) {
        setEmployees(res.data);
        setTotalRecords(res.pagination.totalRecords);
      } else {
        setError(res.message || 'Failed to load employee records');
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError((err as Error).message || 'Failed to communicate with Employee API');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [page, rowsPerPage, debouncedSearch, department, location, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees, refreshTrigger]);

  const getStatusChip = (empStatus: string) => {
    let color: 'success' | 'warning' | 'error' | 'default' = 'default';
    if (empStatus === 'Active') color = 'success';
    else if (empStatus === 'On Leave') color = 'warning';
    else if (empStatus === 'Terminated') color = 'error';

    return (
      <Chip
        label={empStatus}
        size="small"
        color={color}
        variant="outlined"
        sx={{
          fontWeight: 600,
          fontSize: '0.6875rem',
          height: 22,
          borderRadius: '4px',
        }}
      />
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isFiltered =
    Boolean(debouncedSearch) ||
    department !== 'All Departments' ||
    location !== 'All Locations' ||
    status !== 'All Statuses';

  return (
    <Card
      sx={{
        borderRadius: '8px',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
        boxShadow: isDark
          ? '0 1px 3px rgba(0, 0, 0, 0.3)'
          : '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {/* Header & Controls */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box>
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
                <PeopleAltOutlinedIcon sx={{ fontSize: 17 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                Employee Directory
              </Typography>
              <Chip
                label={`${totalRecords} Records`}
                size="small"
                sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600 }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
              Database-backed employee records with server-side pagination, search, and sorting
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {isFiltered && (
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={<FilterListOffIcon sx={{ fontSize: 15 }} />}
                onClick={handleResetFilters}
                sx={{ fontSize: '0.75rem', height: 36, textTransform: 'none' }}
              >
                Clear Filters
              </Button>
            )}
            <Tooltip title="Refresh Records">
              <IconButton
                size="small"
                onClick={() => setRefreshTrigger((prev) => prev + 1)}
                aria-label="Refresh employee records"
                sx={{
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0'}`,
                  height: 36,
                  width: 36,
                  borderRadius: '6px',
                }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Filter Toolbar */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 2,
            alignItems: 'center',
          }}
        >
          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search name, code, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 260 },
              '& .MuiOutlinedInput-root': {
                height: 36,
                fontSize: '0.8125rem',
                borderRadius: '6px',
              },
            }}
            slotProps={{
              htmlInput: {
                'aria-label': 'Search employees by name, code, or email',
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchInput('')} aria-label="Clear employee search">
                      <ClearIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          {/* Department Filter */}
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 160 } }}>
            <InputLabel id="emp-dept-label" sx={{ fontSize: '0.8125rem' }}>
              Department
            </InputLabel>
            <Select
              labelId="emp-dept-label"
              value={department}
              label="Department"
              onChange={(e) => handleDepartmentChange(e.target.value)}
              sx={{ height: 36, fontSize: '0.8125rem', borderRadius: '6px' }}
            >
              {departmentOptions.map((d) => (
                <MenuItem key={d} value={d} sx={{ fontSize: '0.8125rem' }}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Location Filter */}
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 160 } }}>
            <InputLabel id="emp-loc-label" sx={{ fontSize: '0.8125rem' }}>
              Location
            </InputLabel>
            <Select
              labelId="emp-loc-label"
              value={location}
              label="Location"
              onChange={(e) => handleLocationChange(e.target.value)}
              sx={{ height: 36, fontSize: '0.8125rem', borderRadius: '6px' }}
            >
              {locationOptions.map((l) => (
                <MenuItem key={l} value={l} sx={{ fontSize: '0.8125rem' }}>
                  {l}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status Filter */}
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 140 } }}>
            <InputLabel id="emp-status-label" sx={{ fontSize: '0.8125rem' }}>
              Status
            </InputLabel>
            <Select
              labelId="emp-status-label"
              value={status}
              label="Status"
              onChange={(e) => handleStatusChange(e.target.value)}
              sx={{ height: 36, fontSize: '0.8125rem', borderRadius: '6px' }}
            >
              {statusOptions.map((s) => (
                <MenuItem key={s} value={s} sx={{ fontSize: '0.8125rem' }}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => fetchEmployees()}>
                Retry
              </Button>
            }
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* Table Container */}
        <TableContainer
          sx={{
            borderRadius: '6px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
            minHeight: 300,
          }}
        >
          <Table size="small" aria-label="workforce employee table">
            <TableHead sx={{ backgroundColor: isDark ? alpha('#FFFFFF', 0.03) : '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>
                  <TableSortLabel
                    active={sortBy === 'employee_code'}
                    direction={sortBy === 'employee_code' ? sortOrder : 'asc'}
                    onClick={() => handleSort('employee_code')}
                  >
                    Code
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>
                  <TableSortLabel
                    active={sortBy === 'first_name'}
                    direction={sortBy === 'first_name' ? sortOrder : 'asc'}
                    onClick={() => handleSort('first_name')}
                  >
                    Employee Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>
                  <TableSortLabel
                    active={sortBy === 'job_title'}
                    direction={sortBy === 'job_title' ? sortOrder : 'asc'}
                    onClick={() => handleSort('job_title')}
                  >
                    Role & Title
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>
                  <TableSortLabel
                    active={sortBy === 'department_name'}
                    direction={sortBy === 'department_name' ? sortOrder : 'asc'}
                    onClick={() => handleSort('department_name')}
                  >
                    Department
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>
                  <TableSortLabel
                    active={sortBy === 'location'}
                    direction={sortBy === 'location' ? sortOrder : 'asc'}
                    onClick={() => handleSort('location')}
                  >
                    Location
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>
                  <TableSortLabel
                    active={sortBy === 'employment_status'}
                    direction={sortBy === 'employment_status' ? sortOrder : 'asc'}
                    onClick={() => handleSort('employment_status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>
                  <TableSortLabel
                    active={sortBy === 'hire_date'}
                    direction={sortBy === 'hire_date' ? sortOrder : 'asc'}
                    onClick={() => handleSort('hire_date')}
                  >
                    Hire Date
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                Array.from({ length: rowsPerPage > 5 ? 5 : rowsPerPage }).map((_, idx) => (
                  <TableRow key={`skeleton-row-${idx}`}>
                    <TableCell><Skeleton width={60} height={20} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="circular" width={28} height={28} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Skeleton width={120} height={16} />
                          <Skeleton width={160} height={12} />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Skeleton width={140} height={20} /></TableCell>
                    <TableCell><Skeleton width={110} height={20} /></TableCell>
                    <TableCell><Skeleton width={110} height={20} /></TableCell>
                    <TableCell><Skeleton width={70} height={22} /></TableCell>
                    <TableCell><Skeleton width={80} height={20} /></TableCell>
                  </TableRow>
                ))
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      No employees found
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                      Try adjusting or resetting your search and filter criteria.
                    </Typography>
                    {isFiltered && (
                      <Button size="small" variant="outlined" onClick={handleResetFilters}>
                        Reset Filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                    }}
                  >
                    {/* Code */}
                    <TableCell sx={{ fontSize: '0.78125rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {emp.employee_code}
                    </TableCell>

                    {/* Employee Name + Avatar + Email */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            backgroundColor: alpha(theme.palette.primary.main, 0.15),
                            color: theme.palette.primary.main,
                          }}
                        >
                          {getInitials(emp.first_name, emp.last_name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                            {emp.first_name} {emp.last_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6875rem' }}>
                            {emp.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Title */}
                    <TableCell sx={{ fontSize: '0.78125rem' }}>
                      {emp.job_title}
                    </TableCell>

                    {/* Department */}
                    <TableCell sx={{ fontSize: '0.78125rem' }}>
                      {emp.department_name}
                    </TableCell>

                    {/* Location */}
                    <TableCell sx={{ fontSize: '0.78125rem', color: 'text.secondary' }}>
                      {emp.location}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {getStatusChip(emp.employment_status)}
                    </TableCell>

                    {/* Hire Date */}
                    <TableCell sx={{ fontSize: '0.78125rem', fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                      {emp.hire_date}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Server-Side Pagination */}
        <TablePagination
          component="div"
          count={totalRecords}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
            mt: 1,
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.75rem',
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

export default EmployeeTable;
