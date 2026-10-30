import React, { useState, useMemo } from 'react';
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
import { EmployeeTable } from './features/employees';
import { employeeService } from './services/employees.service';
import type { FilterState } from './types';
import { useDashboardData } from './hooks';

const AVAILABLE_DEPARTMENTS = [
  'Engineering',
  'Product & Design',
  'Sales & Marketing',
  'Customer Success',
  'Human Resources',
  'Finance & Legal',
];

const AVAILABLE_LOCATIONS = [
  'San Francisco HQ',
  'London Tech Hub',
  'Singapore Office',
  'Remote Global',
];

const AVAILABLE_CONTRACT_TYPES = [
  'Full-Time',
  'Part-Time',
  'Contractor',
  'Intern',
];

export const App: React.FC = () => {
  // Theme state: default to crisp light mode (Stackly visual reference)
  const [mode, setMode] = useState<'light' | 'dark'>('light');
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

  // State simulator for verifying loading, empty, and error states
  const [viewState, setViewState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');

  // Dialog & Notification feedback states
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [newHireDialogOpen, setNewHireDialogOpen] = useState<boolean>(false);
  const [newHireForm, setNewHireForm] = useState({
    name: '',
    role: '',
    department: 'Engineering',
    location: 'San Francisco HQ',
    type: 'Full-Time',
  });

  // Synchronized computation of all data series based on the 4 active filters
  const {
    totalHeadcount,
    kpis,
    trendPoints,
    departmentChartData,
    workforceDonutSegments,
    filteredActivities,
    loading,
    error,
    partialErrors,
    refetch,
  } = useDashboardData(filters);

  const handleToggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleExport = () => {
    setSnackbarMessage(
      `Workforce CSV report (${filters.department} • ${filters.timeRange.toUpperCase()}) exported successfully.`
    );
  };

  const handleResetAllFilters = () => {
    setFilters({
      department: 'All Departments',
      location: 'All Locations',
      timeRange: '30d',
      employmentType: 'All Types',
      searchQuery: '',
    });
    setViewState('normal');
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
        setSnackbarMessage(`Successfully onboarded ${fullName} into ${newHireForm.department}.`);
        refetch();
      } else {
        setSnackbarMessage(`Failed to create employee dossier: ${res.message || 'Unknown error'}`);
      }
    } catch (err) {
      setSnackbarMessage(`Error creating employee: ${(err as Error).message}`);
    }

    setNewHireForm({
      name: '',
      role: '',
      department: 'Engineering',
      location: 'San Francisco HQ',
      type: 'Full-Time',
    });
  };

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
            if (tab !== 'overview') {
              setSnackbarMessage(`Switched to ${tab.charAt(0).toUpperCase() + tab.slice(1)} view.`);
            }
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
            viewState={viewState}
            onViewStateChange={setViewState}
          />

          {/* Dashboard Body */}
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, flexGrow: 1 }}>
            <Container maxWidth="xl" disableGutters>
              {/* Header Title Section */}
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
                    Human Capital Performance & Dynamics
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                    Monitor global staff presence, structural headcount, and organizational velocity in real time.
                  </Typography>
                </Box>

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
              </Box>

              {/* Main Content: Overview Dashboard or Employee Directory */}
              {activeTab === 'directory' ? (
                <EmployeeTable />
              ) : (
                <>
                  {/* Filters Component (all 4 required filters + reset action) */}
                  <DashboardFilters
                    filters={filters}
                    onFilterChange={setFilters}
                    filteredHeadcount={totalHeadcount}
                  />

                  {/* Conditional States Rendering */}
                  {viewState === 'loading' || (loading && kpis.length === 0) ? (
                    <LoadingSkeleton />
                  ) : viewState === 'error' || error ? (
                    <ErrorState onRetry={() => { setViewState('normal'); refetch(); }} />
                  ) : (viewState === 'empty' || totalHeadcount === 0) && !loading ? (
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
                        <WorkforceDonutChart
                          segments={workforceDonutSegments}
                          totalHeadcount={totalHeadcount}
                        />
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
                    </>
                  )}
                </>
              )}
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
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={newHireForm.department}
                  label="Department"
                  onChange={(e) => setNewHireForm({ ...newHireForm, department: e.target.value })}
                >
                  {AVAILABLE_DEPARTMENTS.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Location Hub</InputLabel>
                <Select
                  value={newHireForm.location}
                  label="Location Hub"
                  onChange={(e) => setNewHireForm({ ...newHireForm, location: e.target.value })}
                >
                  {AVAILABLE_LOCATIONS.map((l) => (
                    <MenuItem key={l} value={l}>
                      {l}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <FormControl fullWidth size="small">
              <InputLabel>Employment Contract</InputLabel>
              <Select
                value={newHireForm.type}
                label="Employment Contract"
                onChange={(e) => setNewHireForm({ ...newHireForm, type: e.target.value })}
              >
                {AVAILABLE_CONTRACT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
          severity="success"
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
