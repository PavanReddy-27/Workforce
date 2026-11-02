/**
 * Attendance Page Feature
 * Fully integrated with SQLite-backed GET /api/attendance.
 * Implements:
 * - Server-side pagination, search, and filters (date range, department, status)
 * - Attendance summary KPIs for the selected date range
 * - Attendance records table with employee details
 * - Export capability
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
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { attendanceService } from '../../services/attendance.service';
import { employeeService } from '../../services/employees.service';
import { departmentService } from '../../services/departments.service';
import type { AttendanceWithEmployee, BackendEmployee, FilterState, KpiMetric } from '../../types';
import { EmployeeDetailDialog } from '../employees/EmployeeDetailDialog';
import { exportToCsv, formatAttendanceDate, formatAttendanceTime } from '../../utils';

const STATUS_OPTIONS = ['All Statuses', 'Present', 'Absent', 'On Leave'];

interface AttendancePageProps {
  dashboardFilters: FilterState;
  dashboardKpis: KpiMetric[];
  dashboardLoading: boolean;
  onDepartmentChange: (department: string) => void;
  onClearDashboardFilters: () => void;
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export const AttendancePage: React.FC<AttendancePageProps> = ({
  dashboardFilters,
  dashboardKpis,
  dashboardLoading,
  onDepartmentChange,
  onClearDashboardFilters,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const defaults = getDefaultDateRange();

  const [records, setRecords] = useState<AttendanceWithEmployee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('attendance_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [status, setStatus] = useState('All Statuses');
  const [departmentOptions, setDepartmentOptions] = useState(['All Departments']);
  const [departmentOptionsError, setDepartmentOptionsError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  // Employee detail dialog state
  const [selectedEmployee, setSelectedEmployee] = useState<BackendEmployee | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [dashboardFilters.department]);

  useEffect(() => {
    let active = true;
    departmentService
      .getDepartments()
      .then((res) => {
        if (!res.success || !Array.isArray(res.data)) {
          throw new Error(res.message || 'Unable to load departments.');
        }
        if (active) {
          setDepartmentOptions(['All Departments', ...res.data.map((item) => item.name)]);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setDepartmentOptionsError(
            err instanceof Error ? err.message : 'Unable to load attendance department filters.'
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const fetchRecords = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await attendanceService.getAttendance(
        {
          page: page + 1,
          limit: rowsPerPage,
          startDate,
          endDate,
          department:
            dashboardFilters.department !== 'All Departments'
              ? dashboardFilters.department
              : undefined,
          location: dashboardFilters.location,
          employeeStatus:
            dashboardFilters.employmentType !== 'All Types'
              ? dashboardFilters.employmentType
              : undefined,
          search: dashboardFilters.searchQuery || undefined,
          status: status !== 'All Statuses' ? status : undefined,
          sortBy,
          sortOrder,
        },
        { signal: controller.signal }
      );

      if (res.success) {
        setRecords(res.data);
        setTotal(res.pagination.totalRecords);

      } else {
        setError(res.message || 'Failed to load attendance records');
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError((err as Error).message || 'Failed to load attendance data');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    startDate,
    endDate,
    dashboardFilters.department,
    dashboardFilters.location,
    dashboardFilters.employmentType,
    dashboardFilters.searchQuery,
    status,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, refreshTrigger]);

  const handleSort = (field: string) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };

  const handleReset = () => {
    const d = getDefaultDateRange();
    setStartDate(d.startDate);
    setEndDate(d.endDate);
    setStatus('All Statuses');
    onClearDashboardFilters();
    setPage(0);
  };

  const getStatusChip = (s: string) => {
    const colorMap: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
      Present: { color: '#10B981', bg: alpha('#10B981', 0.1), icon: <CheckCircleOutlinedIcon sx={{ fontSize: 13 }} /> },
      Absent: { color: '#EF4444', bg: alpha('#EF4444', 0.1), icon: <CancelOutlinedIcon sx={{ fontSize: 13 }} /> },
      'On Leave': { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), icon: <EventBusyOutlinedIcon sx={{ fontSize: 13 }} /> },
    };
    const cfg = colorMap[s] || { color: theme.palette.text.secondary, bg: alpha('#94A3B8', 0.1), icon: null };
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          color: cfg.color,
          backgroundColor: cfg.bg,
          borderRadius: '4px',
          px: 0.875,
          py: 0.375,
          fontSize: '0.6875rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {cfg.icon}
        {s}
      </Box>
    );
  };

  const isFiltered =
    status !== 'All Statuses' ||
    dashboardFilters.department !== 'All Departments' ||
    dashboardFilters.location !== 'All Locations' ||
    dashboardFilters.employmentType !== 'All Types' ||
    Boolean(dashboardFilters.searchQuery) ||
    startDate !== defaults.startDate ||
    endDate !== defaults.endDate;
  const activeEmployeeFilters = [
    dashboardFilters.location !== 'All Locations' ? `Location: ${dashboardFilters.location}` : null,
    dashboardFilters.employmentType !== 'All Types'
      ? `Employment: ${dashboardFilters.employmentType}`
      : null,
    dashboardFilters.searchQuery ? `Search: ${dashboardFilters.searchQuery}` : null,
  ].filter((filter): filter is string => filter !== null);

  const dashboardMetrics = new Map(dashboardKpis.map((metric) => [metric.id, metric]));
  const summaryCardDefinitions: {
    id: KpiMetric['id'];
    label: string;
    color: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'total_employees', label: 'Total Employees', color: '#3B82F6', icon: <PeopleAltOutlinedIcon /> },
    { id: 'present_today', label: 'Present', color: '#10B981', icon: <CheckCircleOutlinedIcon /> },
    { id: 'absent_today', label: 'Absent', color: '#EF4444', icon: <CancelOutlinedIcon /> },
    { id: 'on_leave', label: 'On Leave', color: '#F59E0B', icon: <EventBusyOutlinedIcon /> },
    { id: 'attendance_rate', label: 'Attendance Rate', color: '#3B82F6', icon: <EventAvailableOutlinedIcon /> },
  ];
  const summaryCards = summaryCardDefinitions.map((card) => ({
    ...card,
    value: dashboardMetrics.get(card.id)?.value ?? '0',
    loading: dashboardLoading,
  }));

  const handleExportCsv = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    exportToCsv(
      `attendance_records_${todayStr}.csv`,
      records,
      [
        { header: 'Date', accessor: (r) => formatAttendanceDate(r.attendance_date) },
        { header: 'Employee Code', accessor: (r) => r.employee_code || `EMP-${r.employee_id}` },
        { header: 'Employee Name', accessor: (r) => `${r.first_name} ${r.last_name}` },
        { header: 'Department', accessor: (r) => r.department_name },
        { header: 'Status', accessor: (r) => r.status },
        { header: 'Check In (UTC)', accessor: (r) => formatAttendanceTime(r.check_in_time) },
        { header: 'Check Out (UTC)', accessor: (r) => formatAttendanceTime(r.check_out_time) },
      ]
    );
  };

  return (
    <Box>
      {/* Page Title */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' }, letterSpacing: '-0.02em' }}
        >
          Attendance Management
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
          Attendance snapshot matches Overview; use the date range below to filter attendance records.
        </Typography>
      </Box>

      {departmentOptionsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Unable to load department filters: {departmentOptionsError}
        </Alert>
      )}
      {/* Overview KPI snapshot */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            sm: 'repeat(3, minmax(0, 1fr))',
            lg: 'repeat(5, minmax(0, 1fr))',
          },
          gap: 2,
          mb: 2.5,
        }}
      >
        {summaryCards.map((card) => (
          <Box key={card.label}>
            <Card
              sx={{
                transition: 'transform 0.15s',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              <CardContent sx={{ p: 2, pb: '14px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                    {card.label}
                  </Typography>
                  <Box sx={{ color: card.color, '& svg': { fontSize: 18 } }}>{card.icon}</Box>
                </Box>
                {card.loading ? (
                  <Skeleton width="60%" height={30} />
                ) : (
                  <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: 'text.primary', letterSpacing: '-0.02em' }}>
                    {card.value}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Filter Bar */}
      <Card sx={{ mb: 2, borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}` }}>
        <CardContent sx={{ p: 2, pb: '12px !important' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
              sx={{ width: 160 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
              sx={{ width: 160 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl size="small" sx={{ width: 175 }}>
              <InputLabel>Attendance Status</InputLabel>
              <Select value={status} label="Attendance Status" onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
                {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: 180 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={dashboardFilters.department}
                label="Department"
                onChange={(e) => {
                  onDepartmentChange(e.target.value);
                  setPage(0);
                }}
              >
                {departmentOptions.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              <Tooltip title="Export Attendance CSV">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={handleExportCsv}
                  sx={{ fontSize: '0.75rem', height: 36, textTransform: 'none' }}
                >
                  Export CSV
                </Button>
              </Tooltip>
              {isFiltered && (
                <Button size="small" variant="outlined" startIcon={<FilterListOffIcon />} onClick={handleReset} sx={{ fontSize: '0.75rem', height: 36, textTransform: 'none' }}>
                  Clear
                </Button>
              )}
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={() => setRefreshTrigger((p) => p + 1)} sx={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0'}`, height: 36, width: 36, borderRadius: '6px' }}>
                  <RefreshIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {activeEmployeeFilters.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 0.25 }}>
            Overview employee filters:
          </Typography>
          {activeEmployeeFilters.map((filter) => (
            <Chip key={filter} label={filter} size="small" variant="outlined" />
          ))}
        </Box>
      )}

      {/* Attendance Table */}
      <Card sx={{ borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}` }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 2.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>Attendance Records</Typography>
            <Chip label={`${total.toLocaleString()} Records`} size="small" sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
              {formatAttendanceDate(startDate)} – {formatAttendanceDate(endDate)}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchRecords}>Retry</Button>} sx={{ mx: 2.5, mb: 1 }}>
              {error}
            </Alert>
          )}

          <TableContainer>
            <Table size="small" aria-label="attendance records table">
              <TableHead sx={{ backgroundColor: isDark ? alpha('#FFFFFF', 0.03) : '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>
                    <TableSortLabel active={sortBy === 'attendance_date'} direction={sortBy === 'attendance_date' ? sortOrder : 'asc'} onClick={() => handleSort('attendance_date')}>
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>
                    <TableSortLabel active={sortBy === 'status'} direction={sortBy === 'status' ? sortOrder : 'asc'} onClick={() => handleSort('status')}>
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>Check In (UTC)</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1.25 }}>Check Out (UTC)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell><Skeleton width={90} /></TableCell>
                        <TableCell><Box sx={{ display: 'flex', gap: 1 }}><Skeleton variant="circular" width={28} height={28} /><Box><Skeleton width={120} /><Skeleton width={80} /></Box></Box></TableCell>
                        <TableCell><Skeleton width={110} /></TableCell>
                        <TableCell><Skeleton width={100} /></TableCell>
                        <TableCell><Skeleton width={70} /></TableCell>
                        <TableCell><Skeleton width={60} /></TableCell>
                        <TableCell><Skeleton width={60} /></TableCell>
                      </TableRow>
                    ))
                  : records.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>No attendance records found</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                            Try adjusting the date range or filter criteria.
                          </Typography>
                          {isFiltered && <Button size="small" variant="outlined" onClick={handleReset}>Reset Filters</Button>}
                        </TableCell>
                      </TableRow>
                    )
                  : records.map((rec) => (
                      <TableRow
                        key={rec.id}
                        hover
                        onClick={async () => {
                          try {
                            const empRes = await employeeService.getEmployeeById(rec.employee_id);
                            if (empRes.success && empRes.data) {
                              setSelectedEmployee(empRes.data);
                              setDetailOpen(true);
                            }
                          } catch (err) {
                            setError(
                              err instanceof Error
                                ? `Unable to open employee details: ${err.message}`
                                : 'Unable to open employee details.'
                            );
                          }
                        }}
                        sx={{
                          cursor: 'pointer',
                          '&:last-child td': { border: 0 },
                        }}
                      >
                        <TableCell sx={{ fontSize: '0.78125rem', fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
                          {formatAttendanceDate(rec.attendance_date)}
                        </TableCell>
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
                              {rec.first_name.charAt(0)}{rec.last_name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                                {rec.first_name} {rec.last_name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6875rem' }}>
                                {rec.employee_code}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78125rem' }}>{rec.department_name}</TableCell>
                        <TableCell sx={{ fontSize: '0.78125rem', color: 'text.secondary' }}>{rec.location}</TableCell>
                        <TableCell>{getStatusChip(rec.status)}</TableCell>
                        <TableCell sx={{ fontSize: '0.78125rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                          {formatAttendanceTime(rec.check_in_time)}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78125rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                          {formatAttendanceTime(rec.check_out_time)}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.75rem' },
            }}
          />
        </CardContent>
      </Card>

      {/* Employee Detail Dialog */}
      <EmployeeDetailDialog
        open={detailOpen}
        employee={selectedEmployee}
        onClose={() => setDetailOpen(false)}
        onUpdated={() => fetchRecords()}
        onDeleted={() => fetchRecords()}
      />
    </Box>
  );
};

export default AttendancePage;
