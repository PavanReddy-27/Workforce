/**
 * Departments Page Feature
 * Shows all departments with headcount statistics sourced from the SQLite database.
 * Uses GET /api/departments and GET /api/dashboard/distribution.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Skeleton,
  Alert,
  Button,
  useTheme,
  alpha,
  Avatar,
  TextField,
  InputAdornment,
} from '@mui/material';
import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { dashboardService } from '../../services/dashboard.service';
import { EmployeeTable } from '../employees/EmployeeTable';

const DEPT_COLORS: Record<string, string> = {
  'Engineering': '#6366F1',
  'Product & Design': '#EC4899',
  'Sales & Marketing': '#F59E0B',
  'Customer Success': '#10B981',
  'Human Resources': '#3B82F6',
  'Finance & Legal': '#8B5CF6',
};

function getDeptColor(name: string): string {
  return DEPT_COLORS[name] ?? '#94A3B8';
}

function getDeptInitials(name: string): string {
  return name
    .split(/\s+&?\s*/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface DeptData {
  departmentId: number;
  departmentName: string;
  headcount: number;
  percentage: number;
}

export const DepartmentsPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [departments, setDepartments] = useState<DeptData[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getWorkforceDistribution();
      if (res.success && res.data) {
        setDepartments(res.data.byDepartment);
        setTotalEmployees(res.data.totalEmployees);
      } else {
        setError(res.message || 'Failed to load department data');
      }
    } catch (err) {
      setError((err as Error).message || 'Network error loading departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const filtered = departments.filter((d) =>
    d.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 2.5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, gap: 1.5 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' }, letterSpacing: '-0.02em' }}
          >
            Department Overview
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            Headcount distribution and workforce allocation across all departments.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={`${totalEmployees} Total Employees`}
            size="small"
            variant="outlined"
            icon={<PeopleAltOutlinedIcon sx={{ fontSize: '14px !important' }} />}
            sx={{ fontWeight: 600 }}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
            onClick={() => setRefreshTrigger((p) => p + 1)}
            sx={{ textTransform: 'none', fontSize: '0.8125rem' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Search departments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 280 }, '& .MuiOutlinedInput-root': { height: 36, borderRadius: '6px', fontSize: '0.8125rem' } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchData}>Retry</Button>} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Card */}
      <Card
        sx={{
          mb: 2.5,
          background: isDark
            ? `linear-gradient(135deg, ${alpha('#6366F1', 0.2)} 0%, ${alpha('#8B5CF6', 0.15)} 100%)`
            : `linear-gradient(135deg, ${alpha('#6366F1', 0.06)} 0%, ${alpha('#8B5CF6', 0.04)} 100%)`,
          border: `1px solid ${alpha('#6366F1', isDark ? 0.3 : 0.15)}`,
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: alpha('#6366F1', 0.15), color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DomainOutlinedIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.03em', color: 'text.primary' }}>
                {loading ? <Skeleton width={60} /> : departments.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Active Departments</Typography>
            </Box>
            <Box sx={{ ml: 'auto', textAlign: 'right' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.03em', color: 'text.primary' }}>
                {loading ? <Skeleton width={60} /> : totalEmployees.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Headcount</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Department Cards Grid */}
      <Grid container spacing={2}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid key={`skel-${i}`} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card sx={{ borderRadius: '8px', height: '100%' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Skeleton variant="circular" width={44} height={44} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="70%" height={20} />
                        <Skeleton width="50%" height={14} />
                      </Box>
                    </Box>
                    <Skeleton width="100%" height={8} sx={{ borderRadius: 4 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                      <Skeleton width={60} height={16} />
                      <Skeleton width={40} height={16} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          : filtered.map((dept) => {
              const color = getDeptColor(dept.departmentName);
              const initials = getDeptInitials(dept.departmentName);
              const avgPerDept = totalEmployees > 0 ? totalEmployees / departments.length : 0;
              const isAboveAvg = dept.headcount > avgPerDept;

              const isSelected = selectedDept === dept.departmentName;

              return (
                <Grid key={dept.departmentId} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Card
                    onClick={() => setSelectedDept(isSelected ? null : dept.departmentName)}
                    sx={{
                      borderRadius: '8px',
                      height: '100%',
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${color}` : undefined,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(15, 23, 42, 0.08)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            backgroundColor: alpha(color, isDark ? 0.2 : 0.1),
                            color,
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            borderRadius: '10px',
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700, fontSize: '0.9375rem', color: 'text.primary', lineHeight: 1.2, mb: 0.25 }}
                            noWrap
                          >
                            {dept.departmentName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TrendingUpIcon sx={{ fontSize: 13, color: isAboveAvg ? '#10B981' : 'text.disabled' }} />
                            <Typography variant="caption" sx={{ color: isAboveAvg ? '#10B981' : 'text.secondary', fontWeight: 500, fontSize: '0.6875rem' }}>
                              {isAboveAvg ? 'Above avg' : 'Below avg'}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={`${dept.percentage}%`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            backgroundColor: alpha(color, isDark ? 0.2 : 0.08),
                            color,
                          }}
                        />
                      </Box>

                      {/* Headcount bar */}
                      <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.6875rem' }}>
                            Headcount
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.6875rem' }}>
                            {dept.headcount} of {totalEmployees}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={dept.percentage}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(color, isDark ? 0.15 : 0.08),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: color,
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Box>

                      {/* Bottom stats */}
                      <Box sx={{ display: 'flex', gap: 2, pt: 1.5, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'}` }}>
                        <Box sx={{ textAlign: 'center', flex: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: 'text.primary', lineHeight: 1, letterSpacing: '-0.02em' }}>
                            {dept.headcount}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6875rem' }}>Employees</Typography>
                        </Box>
                        <Box sx={{ width: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />
                        <Box sx={{ textAlign: 'center', flex: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: color, lineHeight: 1, letterSpacing: '-0.02em' }}>
                            {dept.percentage}%
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6875rem' }}>Share</Typography>
                        </Box>
                      </Box>

                      {/* Action button */}
                      <Box sx={{ mt: 1.5 }}>
                        <Button
                          fullWidth
                          size="small"
                          variant={isSelected ? 'contained' : 'outlined'}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', height: 28 }}
                        >
                          {isSelected ? 'Hide Employees' : 'View Employees'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
      </Grid>

      {/* Selected Department Team Members */}
      {selectedDept && (
        <Box sx={{ mt: 3.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
              {selectedDept} Team Members
            </Typography>
            <Button size="small" variant="text" onClick={() => setSelectedDept(null)} sx={{ textTransform: 'none' }}>
              Close Members List
            </Button>
          </Box>
          <EmployeeTable
            title={`${selectedDept} Department Directory`}
            subtitle={`Live SQLite database records for employees in ${selectedDept}`}
            initialDepartment={selectedDept}
          />
        </Box>
      )}

      {!loading && filtered.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <DomainOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>No departments match your search</Typography>
          <Button size="small" onClick={() => setSearch('')}>Clear Search</Button>
        </Box>
      )}
    </Box>
  );
};

export default DepartmentsPage;
