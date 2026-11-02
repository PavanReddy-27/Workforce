import React, { useState, useMemo, useEffect } from 'react';
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
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
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
import { AttendancePage } from './features/attendance/AttendancePage';
import { DepartmentsPage } from './features/departments/DepartmentsPage';
import { employeeService } from './services/employees.service';
import { departmentService } from './services/departments.service';
import type { FilterState } from './types';
import { useDashboardData } from './hooks';
import { exportToCsv } from './utils';

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

export const App: React.FC = () => {
  // Theme state persisted in localStorage
  const [mode, setMode] = useState<'light' | 'dark'>(getInitialMode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Navigation states
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

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
  const [tableRefreshKey, setTableRefreshKey] = useState<number>(0);
  const [newHireDialogOpen, setNewHireDialogOpen] = useState<boolean>(false);
  const [newHireForm, setNewHireForm] = useState({
    name: '',
    role: '',
    department: '',
    location: '',
  });
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  // Persist color mode
  useEffect(() => {
    try {
      localStorage.setItem('wfa-color-mode', mode);
    } catch {
      /* no-op */
    }
  }, [mode]);

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

  // Synchronized computation of all data series based on the 4 active filters
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

  const handleToggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleExport = async () => {
    try {
      setSnackbarSeverity('info');
      setSnackbarMessage('Generating workforce analytics CSV report...');
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

  const handleNewHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = newHireForm.name.trim();
    const role = newHireForm.role.trim();
    if (!fullName || !role) {
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
        job_title: role,
        department: newHireForm.department,
        location: newHireForm.location,
        employment_status: 'Active',
      });

      if (res.success) {
        setSnackbarSeverity('success');
        setSnackbarMessage(`Successfully onboarded ${fullName} into ${newHireForm.department}.`);
        refetch();
        setTableRefreshKey((prev) => prev + 1);
      } else {
        setSnackbarSeverity('error');
        setSnackbarMessage(`Failed to create employee dossier: ${res.message || 'Unknown error'}`);
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
        return <EmployeeTable refreshTrigger={tableRefreshKey} />;

      case 'attendance':
        return (
          <AttendancePage
            dashboardFilters={filters}
            dashboardKpis={kpis}
            dashboardLoading={loading}
            onDepartmentChange={(department) =>
              setFilters((prev) => ({ ...prev, department }))
            }
            onClearDashboardFilters={handleResetAllFilters}
          />
        );

      case 'departments':
        return <DepartmentsPage />;

      case 'recruitment':
        return (
          <PlaceholderPage
            title="Recruitment Pipeline"
            description="Recruitment management is outside the scope of the current Workforce Analytics release."
            icon={<WorkOutlineOutlinedIcon />}
            color="#F59E0B"
          />
        );

      case 'performance':
        return (
          <PlaceholderPage
            title="Performance Analytics"
            description="Performance reviews and goal tracking are outside the scope of the current Workforce Analytics release."
            icon={<AssessmentOutlinedIcon />}
            color="#10B981"
          />
        );

      case 'payroll':
        return (
          <PlaceholderPage
            title="Payroll & Compensation"
            description="Payroll and compensation management are outside the scope of the current Workforce Analytics release."
            icon={<AccountBalanceWalletOutlinedIcon />}
            color="#8B5CF6"
          />
        );

      case 'settings':
        return (
          <PlaceholderPage
            title="Platform Settings"
            description="Account, integration, and platform settings are outside the scope of the current Workforce Analytics release."
            icon={<SettingsOutlinedIcon />}
            color="#64748B"
          />
        );

      default:
        return (
          <>
            {/* Filters Component (all 4 required filters + reset action) */}
            <DashboardFilters
              filters={filters}
              onFilterChange={setFilters}
              filteredHeadcount={matchingHeadcount}
            />

            {/* Conditional States Rendering */}
            {loading && kpis.length === 0 ? (
              <LoadingSkeleton />
            ) : error ? (
              <ErrorState onRetry={refetch} />
            ) : totalHeadcount === 0 && !loading ? (
              <EmptyState onResetFilters={handleResetAllFilters} />
            ) : (
              <>
                {/* Exactly 5 Primary KPI Cards in a balanced desktop grid */}
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
                    onViewAll={() => setActiveTab('directory')}
                  />
                </Box>

                {/* Row 3: Live Employee Directory synchronized with database & filters */}
                <Box sx={{ mt: 3 }}>
                  <EmployeeTable
                    title="Workforce Employee Directory"
                    subtitle="Live SQLite database records synchronized with active filters"
                    searchQuery={filters.searchQuery}
                    initialDepartment={filters.department}
                    initialLocation={filters.location}
                    initialStatus={filters.employmentType}
                    refreshTrigger={tableRefreshKey}
                  />
                </Box>
              </>
            )}
          </>
        );
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'directory': return { title: 'Employee Directory', subtitle: 'Manage and view all employees with server-side search, sorting and pagination.' };
      case 'attendance': return null; // AttendancePage renders its own title
      case 'departments': return null; // DepartmentsPage renders its own title
      case 'recruitment': return null;
      case 'performance': return null;
      case 'payroll': return null;
      case 'settings': return null;
      default: return {
        title: 'Human Capital Performance & Dynamics',
        subtitle: 'Monitor global staff presence, structural headcount, and organizational velocity in real time.',
      };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
        {/* Navigation Sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
          }}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Main Application Area */}
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
          {/* Topbar Header */}
          <Topbar
            mode={mode}
            onToggleMode={handleToggleMode}
            onOpenMobileSidebar={() => setMobileOpen(true)}
            searchQuery={filters.searchQuery}
            onSearchChange={(q) => setFilters((prev) => ({ ...prev, searchQuery: q }))}
            onExportClick={handleExport}
            onAddEmployeeClick={() => setNewHireDialogOpen(true)}
          />

          {/* Dashboard Body */}
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, flexGrow: 1 }}>
            <Container maxWidth="xl" disableGutters>
              {/* Header Title Section — only show for overview and directory */}
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
                        label="Target: 95% Presence"
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.75rem', height: 26 }}
                      />
                      <Chip
                        label="Live Telemetry"
                        size="small"
                        color="success"
                        sx={{ fontWeight: 600, fontSize: '0.75rem', height: 26 }}
                      />
                    </Box>
                  )}
                </Box>
              )}

              {/* Main Content Area */}
              {renderMainContent()}
            </Container>
          </Box>
        </Box>
      </Box>

      {/* New Hire Requisition Modal */}
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
            Initiate New Hire Requisition
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Create an onboarding dossier for a newly hired employee or approved headcount allocation.
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
              Complete Onboarding
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Interactive Global Snackbar Feedback */}
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
    </ThemeProvider>
  );
};

export default App;
