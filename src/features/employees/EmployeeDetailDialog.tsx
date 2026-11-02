/**
 * Employee Detail, Edit, and Delete Dialog
 * Opens when clicking a row in the Employee Table.
 * Supports viewing full employee profile, editing fields, and deleting the employee.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import type { BackendEmployee } from '../../types';
import { employeeService } from '../../services/employees.service';
import { departmentService } from '../../services/departments.service';

const STATUSES = ['Active', 'On Leave', 'Terminated', 'Suspended'];

interface EmployeeDetailDialogProps {
  employee: BackendEmployee | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (updated: BackendEmployee) => void;
  onDeleted: (id: number) => void;
}

function getInitials(f: string, l: string) {
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
}

const STATUS_COLORS: Record<string, string> = {
  Active: '#10B981',
  'On Leave': '#F59E0B',
  Terminated: '#EF4444',
  Suspended: '#8B5CF6',
};

export const EmployeeDetailDialog: React.FC<EmployeeDetailDialogProps> = ({
  employee,
  open,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    job_title: '',
    department: '',
    location: '',
    employment_status: '',
    hire_date: '',
  });

  // Reset form when employee changes or dialog opens
  React.useEffect(() => {
    if (employee) {
      setForm({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        job_title: employee.job_title,
        department: employee.department_name,
        location: employee.location,
        employment_status: employee.employment_status,
        hire_date: employee.hire_date,
      });
    }
    setMode('view');
    setError(null);
  }, [employee, open]);

  React.useEffect(() => {
    if (!open) return;

    let active = true;
    Promise.all([departmentService.getDepartments(), employeeService.getLocations()])
      .then(([departmentResponse, locationResponse]) => {
        if (!departmentResponse.success || !Array.isArray(departmentResponse.data)) {
          throw new Error(departmentResponse.message || 'Unable to load departments.');
        }
        if (!locationResponse.success || !Array.isArray(locationResponse.data)) {
          throw new Error(locationResponse.message || 'Unable to load locations.');
        }
        if (active) {
          setDepartments(departmentResponse.data.map((department) => department.name));
          setLocations(locationResponse.data);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load employee edit options.');
        }
      });

    return () => {
      active = false;
    };
  }, [open]);

  const handleSave = async () => {
    if (!employee) return;
    setSaving(true);
    setError(null);
    try {
      const res = await employeeService.updateEmployee(employee.id, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        job_title: form.job_title,
        department: form.department,
        location: form.location,
        employment_status: form.employment_status,
        hire_date: form.hire_date,
      });
      if (res.success && res.data) {
        onUpdated(res.data);
        setMode('view');
      } else {
        setError(res.message || 'Failed to update employee');
      }
    } catch (err) {
      setError((err as Error).message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!employee) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await employeeService.deleteEmployee(employee.id);
      if (res.success) {
        onDeleted(employee.id);
        onClose();
      } else {
        setError(res.message || 'Failed to delete employee');
      }
    } catch (err) {
      setError((err as Error).message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (!employee) return null;

  const accentColor = STATUS_COLORS[employee.employment_status] ?? '#6366F1';

  return (
    <Dialog
      open={open}
      onClose={mode === 'view' ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: '12px' } } }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          background: isDark
            ? `linear-gradient(135deg, ${alpha(accentColor, 0.15)}, ${alpha(accentColor, 0.05)})`
            : `linear-gradient(135deg, ${alpha(accentColor, 0.07)}, ${alpha(accentColor, 0.02)})`,
          borderBottom: `1px solid ${alpha(accentColor, isDark ? 0.25 : 0.12)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              fontSize: '1.1rem',
              fontWeight: 700,
              backgroundColor: alpha(accentColor, isDark ? 0.25 : 0.15),
              color: accentColor,
              border: `2px solid ${alpha(accentColor, 0.3)}`,
            }}
          >
            {getInitials(employee.first_name, employee.last_name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.2 }}>
              {employee.first_name} {employee.last_name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {employee.job_title} · {employee.employee_code}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={employee.employment_status}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: alpha(accentColor, 0.12),
                  color: accentColor,
                }}
              />
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ alignSelf: 'flex-start' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 2.5 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {mode === 'confirm-delete' ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <DeleteOutlinedIcon sx={{ fontSize: 48, color: 'error.main', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Delete {employee.first_name} {employee.last_name}?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0 }}>
              This action is permanent and cannot be undone. All associated attendance records for this employee will also be removed.
            </Typography>
          </Box>
        ) : mode === 'edit' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="First Name" size="small" fullWidth value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <TextField label="Last Name" size="small" fullWidth value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </Box>
            <TextField label="Email" size="small" fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Job Title" size="small" fullWidth value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Department</InputLabel>
                <Select value={form.department} label="Department" onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Location</InputLabel>
                <Select value={form.location} label="Location" onChange={(e) => setForm({ ...form, location: e.target.value })}>
                  {locations.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.employment_status} label="Status" onChange={(e) => setForm({ ...form, employment_status: e.target.value })}>
                  {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                label="Hire Date"
                type="date"
                size="small"
                fullWidth
                value={form.hire_date}
                onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          </Box>
        ) : (
          /* View mode */
          <Box>
            {[
              { label: 'Employee Code', value: employee.employee_code },
              { label: 'Email', value: employee.email },
              { label: 'Job Title', value: employee.job_title },
              { label: 'Department', value: employee.department_name },
              { label: 'Location', value: employee.location },
              { label: 'Status', value: employee.employment_status },
              { label: 'Hire Date', value: employee.hire_date },
              { label: 'Created', value: new Date(employee.created_at).toLocaleDateString() },
            ].map((item, i) => (
              <Box key={item.label}>
                {i > 0 && <Divider sx={{ my: 1.25 }} />}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, minWidth: 120 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
                    {item.value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 2, gap: 1 }}>
        {mode === 'view' && (
          <>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlinedIcon sx={{ fontSize: 15 }} />}
              onClick={() => setMode('confirm-delete')}
              sx={{ textTransform: 'none', mr: 'auto' }}
            >
              Delete
            </Button>
            <Button size="small" variant="outlined" onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
              onClick={() => setMode('edit')}
              sx={{ textTransform: 'none' }}
            >
              Edit
            </Button>
          </>
        )}
        {mode === 'edit' && (
          <>
            <Button size="small" variant="outlined" onClick={() => { setMode('view'); setError(null); }} sx={{ textTransform: 'none', mr: 'auto' }} disabled={saving}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={saving ? <CircularProgress size={13} color="inherit" /> : <SaveOutlinedIcon sx={{ fontSize: 15 }} />}
              onClick={handleSave}
              disabled={saving}
              sx={{ textTransform: 'none' }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </>
        )}
        {mode === 'confirm-delete' && (
          <>
            <Button size="small" variant="outlined" onClick={() => { setMode('view'); setError(null); }} sx={{ textTransform: 'none', mr: 'auto' }} disabled={deleting}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={deleting ? <CircularProgress size={13} color="inherit" /> : <DeleteOutlinedIcon sx={{ fontSize: 15 }} />}
              onClick={handleDelete}
              disabled={deleting}
              sx={{ textTransform: 'none' }}
            >
              {deleting ? 'Deleting…' : 'Confirm Delete'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeDetailDialog;
