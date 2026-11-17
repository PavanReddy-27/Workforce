import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { createAppTheme } from './theme/theme';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardFilters } from './components/DashboardFilters';
import { KpiCard } from './components/KpiCard';
import { AttendanceTrendChart } from './components/AttendanceTrendChart';
import { DepartmentDistributionChart } from './components/DepartmentDistributionChart';
import { WorkforceDonutChart } from './components/WorkforceDonutChart';
import { RecentActivity } from './components/RecentActivity';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { PlaceholderPage } from './components/PlaceholderPage';
import { EmployeeTable } from './features/employees';
import { AttendancePage } from './features/attendance';
import { EmployeeDashboard } from './features/dashboard';
import { DepartmentsPage } from './features/departments';
import {
  LoginPage,
  AccessDeniedPage,
  AuthLoadingScreen,
  LoginRoute,
  RequireAuthentication,
} from './features/auth';
import { UserManagementPage, AuditLogsPage, ActiveSessionsPage } from './features/admin';
import { SettingsPage } from './features/settings';
import { employeeService, departmentService } from './services';
import type { FilterState, Permission, UserRole } from './types';
import { useDashboardData } from './hooks';
import { exportToCsv } from './utils';
import { AuthProvider, useAuth } from './context';

/** Persist and retrieve the user's color mode preference */
function getInitialMode(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('wfa-color-mode');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* no-op */
  }
  return 'light';
}

const TAB_PATHS: Record<string, string> = {
  directory: 'employees',
  'audit-logs': 'audit-logs',
};

interface WorkspaceRoute {
  tab: string;
  permissions?: Permission[];
  roles?: UserRole[];
}

const WORKSPACE_ROUTES: Record<string, WorkspaceRoute> = {
  '/': { tab: 'overview', permissions: ['dashboard:view'] },
  '/employees': {
    tab: 'directory',
    permissions: ['employees:read_all', 'employees:read_dept'],
  },
  '/attendance': {
    tab: 'attendance',
    permissions: ['attendance:read_all', 'attendance:read_dept', 'attendance:read_own'],
  },
  '/departments': { tab: 'departments', permissions: ['departments:read'] },
  '/users': { tab: 'users', permissions: ['users:manage'] },
  '/audit-logs': { tab: 'audit-logs', permissions: ['audit:view'] },
  '/sessions': { tab: 'sessions', permissions: ['users:manage'] },
  '/recruitment': { tab: 'recruitment', roles: ['admin', 'hr'] },
  '/performance': { tab: 'performance', roles: ['admin', 'hr', 'manager'] },
  '/payroll': { tab: 'payroll', roles: ['admin', 'hr'] },
  '/settings': { tab: 'settings', permissions: ['settings:manage'] },
};

const hasAnyPermission = (
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean => requiredPermissions.some((permission) => userPermissions.includes(permission));

const ProtectedWorkspaceRoute: React.FC<{
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}> = ({ mode, onToggleMode }) => {
  const { permissions, hasRole } = useAuth();
  const { pathname } = useLocation();
  const routePath = pathname.replace(/\/+$/, '') || '/';
  const navigate = useNavigate();
  const route = WORKSPACE_ROUTES[routePath];

  if (!route) return <Navigate to="/" replace />;

  const authorized = route.permissions
    ? hasAnyPermission(permissions, route.permissions)
    : route.roles
      ? hasRole(...route.roles)
      : false;

  if (!authorized) {
    return (
      <AccessDeniedPage
        requiredPermission={route.permissions?.[0]}
        requiredRole={route.roles?.join(' or ')}
        onGoHome={() => navigate('/')}
      />
    );
  }

  return <AuthenticatedAppContent activeTab={route.tab} mode={mode} onToggleMode={onToggleMode} />;
};

const AuthenticatedAppContent: React.FC<{
  activeTab: string;
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}> = ({ activeTab, mode, onToggleMode }) => {
  const { role, hasPermission } = useAuth();
  const navigate = useNavigate();

  // Navigation states
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    department: 'All Departments',
    location: 'All Locations',
    timeRange: '30d',
    employmentType: 'All Types',
    searchQuery: '',
  });

  // Dialog & Notification feedback states
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [workforceRefreshKey, setWorkforceRefreshKey] = useState<number>(0);
  const [newHireDialogOpen, setNewHireDialogOpen] = useState<boolean>(false);
  const [newHireForm, setNewHireForm] = useState({
    name: '',
    role: '',
    department: '',
    location: '',
  });
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    departmentService
      .getDepartments()
      .then((res) => {
        if (!res.success || !Array.isArray(res.data)) {
          throw new Error(res.message || 'Unable to load departments.');
        }
        if (active) {
          const names = res.data.map((department) => department.name);
          setAvailableDepartments(names);
          setNewHireForm((prev) => ({
            ...prev,
            department: names.includes(prev.department) ? prev.department : names[0] ?? '',
          }));
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setSnackbarSeverity('error');
          setSnackbarMessage(
            err instanceof Error ? `Unable to load departments: ${err.message}` : 'Unable to load departments.'
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Synchronized computation of all data series based on active filters
  const {
    totalHeadcount,
    kpis,
    trendPoints,
    departmentChartData,
    workforceDonutSegments,
    filteredActivities,
    matchingHeadcount,
    loading,
    error,
    partialErrors,
    refetch,
  } = useDashboardData(filters);

  const handleWorkforceDataChanged = useCallback(() => {
    setWorkforceRefreshKey((prev) => prev + 1);
    refetch();
  }, [refetch]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        handleWorkforceDataChanged();
      }
    };

    const intervalId = window.setInterval(refreshWhenVisible, 15_000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [handleWorkforceDataChanged]);

  const handleExport = async () => {
    try {
      setSnackbarSeverity('info');
      setSnackbarMessage('Exporting employee records to CSV...');
      const res = await employeeService.getEmployees({ limit: 1000 });
      const records = res?.data || [];
      if (!records || records.length === 0) {
        setSnackbarSeverity('warning');
        setSnackbarMessage('No employee records available to export.');
        return;
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const filename = `workforce_analytics_report_${todayStr}.csv`;

      const success = exportToCsv(
        filename,
        records,
        [
          { header: 'Employee Code', accessor: (e) => e.employee_code || `EMP-${e.id}` },
          { header: 'First Name', accessor: (e) => e.first_name },
          { header: 'Last Name', accessor: (e) => e.last_name },
          { header: 'Email', accessor: (e) => e.email },
          { header: 'Department', accessor: (e) => e.department_name || e.department_id },
          { header: 'Job Title', accessor: (e) => e.job_title },
          { header: 'Location', accessor: (e) => e.location },
          { header: 'Employment Status', accessor: (e) => e.employment_status },
          { header: 'Hire Date', accessor: (e) => e.hire_date },
        ]
      );

      if (success) {
        setSnackbarSeverity('success');
        setSnackbarMessage(
          `Successfully downloaded ${filename} (${records.length} records).`
        );
      } else {
        setSnackbarSeverity('error');
        setSnackbarMessage('Failed to trigger CSV file download.');
      }
    } catch (err) {
      setSnackbarSeverity('error');
      setSnackbarMessage(`Export failed: ${(err as Error).message}`);
    }
  };

  const handleResetAllFilters = () => {
    setFilters({
      department: 'All Departments',
      location: 'All Locations',
      timeRange: '30d',
      employmentType: 'All Types',
      searchQuery: '',
    });
  };

  const handleNewHireSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const fullName = newHireForm.name.trim();
    const employeeRole = newHireForm.role.trim();
    if (!fullName || !employeeRole) {
      return;
    }

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Employee';

    setNewHireDialogOpen(false);

    try {
      const res = await employeeService.createEmployee({
        first_name: firstName,
        last_name: lastName,
        job_title: employeeRole,
        department: newHireForm.department,
        location: newHireForm.location,
        employment_status: 'Active',
      });

      if (res.success) {
        setSnackbarSeverity('success');
        setSnackbarMessage(`Successfully added ${fullName} to ${newHireForm.department}.`);
        handleWorkforceDataChanged();
      } else {
        setSnackbarSeverity('error');
        setSnackbarMessage(`Failed to create employee: ${res.message || 'Unknown error'}`);
      }
    } catch (err) {
      setSnackbarSeverity('error');
      setSnackbarMessage(`Error creating employee: ${(err as Error).message}`);
    }

    setNewHireForm({
      name: '',
      role: '',
      department: availableDepartments[0] ?? '',
      location: '',
    });
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'directory':
        // RBAC: Directory accessible to Admin, HR, Manager, Team Lead
        if (!hasPermission('employees:read_all') && !hasPermission('employees:read_dept')) {
          return (
            <AccessDeniedPage
              requiredPermission="employees:read_all"
              onGoHome={() => navigate('/')}
            />
          );
        }
        return (
          <EmployeeTable
            initialDepartment={filters.department}
            onDepartmentChange={(department) =>
              setFilters((prev) => ({ ...prev, department }))
            }
            refreshTrigger={workforceRefreshKey}
            onDataChanged={handleWorkforceDataChanged}
          />
        );

      case 'attendance':
        if (!hasPermission('attendance:read_all') && !hasPermission('attendance:read_dept') && !hasPermission('attendance:read_own')) {
          return (
            <AccessDeniedPage
              requiredPermission="attendance:read_own"
              onGoHome={() => navigate('/')}
            />
          );
        }
        return (
          <AttendancePage
            dashboardFilters={filters}
            dashboardKpis={kpis}
            dashboardLoading={loading}
            onDepartmentChange={(department) =>
              setFilters((prev) => ({ ...prev, department }))
            }
            onClearDashboardFilters={handleResetAllFilters}
            dataRefreshTrigger={workforceRefreshKey}
            onDataChanged={handleWorkforceDataChanged}
          />
        );

      case 'departments':
        if (!hasPermission('departments:read')) {
          return (
            <AccessDeniedPage
              requiredPermission="departments:read"
              onGoHome={() => navigate('/')}
            />
          );
        }
        return (
          <DepartmentsPage
            department={filters.department}
            onDepartmentChange={(department) =>
              setFilters((prev) => ({ ...prev, department }))
            }
            dataRefreshTrigger={workforceRefreshKey}
            onDataChanged={handleWorkforceDataChanged}
          />
        );

      case 'users':
        if (!hasPermission('users:manage')) {
          return (
            <AccessDeniedPage
              requiredPermission="users:manage"
              onGoHome={() => navigate('/')}
            />
          );
        }
        return <UserManagementPage />;

      case 'audit-logs':
        if (!hasPermission('audit:view')) {
          return (
            <AccessDeniedPage
              requiredPermission="audit:view"
              onGoHome={() => navigate('/')}
            />
          );
        }
        return <AuditLogsPage />;

      case 'sessions':
        if (!hasPermission('users:manage')) {
          return (
            <AccessDeniedPage
              requiredPermission="users:manage"
              onGoHome={() => navigate('/')}
            />
          );
        }
        return <ActiveSessionsPage />;

      case 'recruitment':
        return (
          <PlaceholderPage
            title="Recruitment Pipeline"
            description="Recruitment management module for HR and Talent Acquisition teams."
            icon={<WorkOutlineOutlinedIcon />}
            color="#F59E0B"
          />
        );

      case 'performance':
        return (
          <PlaceholderPage
            title="Performance Analytics"
            description="Performance reviews, goal tracking, and appraisal cycles."
            icon={<AssessmentOutlinedIcon />}
            color="#10B981"
          />
        );

      case 'payroll':
        return (
          <PlaceholderPage
            title="Payroll & Compensation"
            description="Payroll and compensation management for Finance and People Operations."
            icon={<AccountBalanceWalletOutlinedIcon />}
            color="#8B5CF6"
          />
        );

      case 'settings':
        return <SettingsPage />;

      default: {
        if (role === 'employee') {
          return (
            <EmployeeDashboard
              trendPoints={trendPoints}
              timeRange={filters.timeRange}
              onTimeRangeChange={(timeRange) => setFilters((prev) => ({ ...prev, timeRange }))}
              loading={loading}
              trendError={partialErrors.attendance}
              onRefresh={refetch}
            />
          );
        }

        let dashboardContent: React.ReactNode;

        if (loading && kpis.length === 0) {
          dashboardContent = <LoadingSkeleton />;
        } else if (error) {
          dashboardContent = <ErrorState onRetry={refetch} />;
        } else if (totalHeadcount === 0 && !loading) {
          dashboardContent = <EmptyState onResetFilters={handleResetAllFilters} />;
        } else {
          dashboardContent = (
            <>
              {/* 5 Primary KPI Cards */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(5, 1fr)',
                  },
                  gap: 2,
                  mb: 2.5,
                }}
              >
                {kpis.map((metric) => (
                  <KpiCard key={metric.id} metric={metric} loading={loading} />
                ))}
              </Box>

              {/* Row 1: Attendance Trend Chart + Workforce Status Donut */}
              {partialErrors.attendance && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {partialErrors.attendance}
                </Alert>
              )}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' },
                  gap: 2.5,
                  mb: 2.5,
                  alignItems: 'stretch',
                }}
              >
                <AttendanceTrendChart data={trendPoints} timeRange={filters.timeRange} />
                <WorkforceDonutChart segments={workforceDonutSegments} />
              </Box>

              {/* Row 2: Department Distribution Chart + Recent Employee Activity */}
              {partialErrors.distribution && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {partialErrors.distribution}
                </Alert>
              )}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' },
                  gap: 2.5,
                  mb: 2.5,
                  alignItems: 'stretch',
                }}
              >
                <DepartmentDistributionChart
                  data={departmentChartData}
                  selectedDepartment={filters.department}
                  onSelectDepartment={(dept) =>
                    setFilters((prev) => ({ ...prev, department: dept }))
                  }
                />
                <RecentActivity
                  activities={filteredActivities}
                  onViewAll={() => navigate('/employees')}
                />
              </Box>

              {/* Row 3: Live Employee Directory (if permitted) */}
              {(hasPermission('employees:read_all') || hasPermission('employees:read_dept')) && (
                <Box sx={{ mt: 3 }}>
                  <EmployeeTable
                    title="Workforce Employee Directory"
                    subtitle="Live SQLite database records synchronized with active filters"
                    searchQuery={filters.searchQuery}
                    initialDepartment={filters.department}
                    initialLocation={filters.location}
                    initialStatus={filters.employmentType}
                    onDepartmentChange={(department) =>
                      setFilters((prev) => ({ ...prev, department }))
                    }
                    refreshTrigger={workforceRefreshKey}
                    onDataChanged={handleWorkforceDataChanged}
                  />
                </Box>
              )}
            </>
          );
        }

        return (
          <>
            <DashboardFilters
              filters={filters}
              onFilterChange={setFilters}
              filteredHeadcount={matchingHeadcount}
            />
            {dashboardContent}
          </>
        );
      }
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'directory':
        return {
          title: 'Employee Directory',
          subtitle: 'Manage and view personnel records with search, sorting, and pagination.',
        };
      case 'users':
        return {
          title: 'Security & Access Governance',
          subtitle: 'Administer system accounts, assign RBAC roles, and manage permissions.',
        };
      case 'audit-logs':
        return {
          title: 'Security Audit & Traceability',
          subtitle: 'Immutable logs of authentication events, authorization checks, and sensitive mutations.',
        };
      case 'sessions':
        return {
          title: 'Active Session Governance',
          subtitle: 'Monitor active user sessions and terminate tokens in real time.',
        };
      case 'settings':
        return {
          title: 'Account & Security Settings',
          subtitle: 'Manage your password and multi-factor authentication.',
        };
      case 'attendance':
      case 'departments':
      case 'recruitment':
      case 'performance':
      case 'payroll':
        return null;
      default:
        if (role === 'employee') return null;
        return {
          title: 'Workforce Overview',
          subtitle:
            role === 'manager'
              ? 'Review company-wide workforce and attendance trends.'
              : role === 'team_lead'
                ? 'Review your department roster and team attendance trends.'
                : role === 'hr'
                  ? 'Review company-wide workforce and attendance analytics.'
                  : 'Monitor workforce analytics and manage platform access.',
        };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        activeTab={activeTab}
        onSelectTab={(tab) => navigate(tab === 'overview' ? '/' : `/${TAB_PATHS[tab] ?? tab}`)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflowX: 'hidden',
        }}
      >
        <Topbar
          mode={mode}
          onToggleMode={onToggleMode}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          searchQuery={filters.searchQuery}
          onSearchChange={(q) => setFilters((prev) => ({ ...prev, searchQuery: q }))}
          onExportClick={handleExport}
          onAddEmployeeClick={() => setNewHireDialogOpen(true)}
        />

        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, flexGrow: 1 }}>
          <Container maxWidth="xl" disableGutters>
            {pageInfo && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  mb: 2.5,
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      letterSpacing: '-0.02em',
                      color: 'text.primary',
                    }}
                  >
                    {pageInfo.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                    {pageInfo.subtitle}
                  </Typography>
                </Box>

                {activeTab === 'overview' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label="Target: 95% Attendance"
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.75rem', height: 26 }}
                    />
                    <Chip
                      label="Auto-updating · 15s"
                      size="small"
                      color="success"
                      sx={{ fontWeight: 600, fontSize: '0.75rem', height: 26 }}
                    />
                  </Box>
                )}
              </Box>
            )}

            {renderMainContent()}
          </Container>
        </Box>
      </Box>

      {/* Add Employee Dialog */}
      <Dialog
        open={newHireDialogOpen}
        onClose={() => setNewHireDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '8px',
              p: 1,
            },
          },
        }}
      >
        <form onSubmit={handleNewHireSubmit}>
          <DialogTitle sx={{ fontWeight: 600, pb: 1, fontSize: '1.05rem' }}>
            Add New Employee
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Enter details to add a new employee to the workforce directory.
            </Typography>

            <TextField
              label="Full Name"
              required
              fullWidth
              size="small"
              value={newHireForm.name}
              onChange={(e) => setNewHireForm({ ...newHireForm, name: e.target.value })}
              placeholder="e.g. Jordan Hayes"
            />

            <TextField
              label="Job Title / Role"
              required
              fullWidth
              size="small"
              value={newHireForm.role}
              onChange={(e) => setNewHireForm({ ...newHireForm, role: e.target.value })}
              placeholder="e.g. Senior Frontend Architect"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Department</InputLabel>
                <Select
                  value={newHireForm.department}
                  label="Department"
                  onChange={(e) => setNewHireForm({ ...newHireForm, department: e.target.value })}
                >
                  {availableDepartments.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Location"
                required
                fullWidth
                size="small"
                value={newHireForm.location}
                onChange={(e) => setNewHireForm({ ...newHireForm, location: e.target.value })}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setNewHireDialogOpen(false)}
              size="small"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="small"
            >
              Add Employee
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Global Snackbar Feedback */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarMessage(null)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: '6px',
            fontWeight: 500,
            fontSize: '0.8125rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const AppContent: React.FC<{
  mode: 'light' | 'dark';
  onToggleMode: () => void;
}> = ({ mode, onToggleMode }) => {
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute><LoginPage /></LoginRoute>} />
      <Route element={<RequireAuthentication />}>
        <Route
          path="/access-denied"
          element={<AccessDeniedPage onGoHome={() => navigate('/')} />}
        />
        <Route path="*" element={<ProtectedWorkspaceRoute mode={mode} onToggleMode={onToggleMode} />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>(getInitialMode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  useEffect(() => {
    try {
      localStorage.setItem('wfa-color-mode', mode);
    } catch {
      /* no-op */
    }
  }, [mode]);

  const handleToggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppContent mode={mode} onToggleMode={handleToggleMode} />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
