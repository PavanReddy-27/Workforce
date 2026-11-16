import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import RefreshIcon from '@mui/icons-material/Refresh';
import { authService } from '../../services/auth.service';
import type { SafeUser, UserRole } from '../../types';

const ROLE_COLORS: Record<UserRole, 'error' | 'primary' | 'warning' | 'info' | 'default'> = {
  admin: 'error',
  hr: 'primary',
  manager: 'warning',
  team_lead: 'info',
  employee: 'default',
};

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add User Dialog
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('Password@123');
  const [newRole, setNewRole] = useState<UserRole>('employee');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Role Edit Dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('employee');

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authService.getUsers(1, 100);
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err) {
      const e = err as { message?: string };
      setErrorMsg(e.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: SafeUser) => {
    try {
      const newStatus = !user.is_active;
      const res = await authService.updateUserStatus(user.id, newStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: newStatus } : u))
        );
        setSuccessMsg(`User '${user.username}' is now ${newStatus ? 'Active' : 'Deactivated'}.`);
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err) {
      const e = err as { message?: string };
      setErrorMsg(e.message || 'Failed to toggle account status');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const handleOpenRoleDialog = (user: SafeUser) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await authService.updateUserRole(selectedUser.id, editRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, role: editRole } : u))
        );
        setRoleDialogOpen(false);
        setSuccessMsg(`Updated role for '${selectedUser.username}' to ${editRole.toUpperCase()}.`);
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err) {
      const e = err as { message?: string };
      setErrorMsg(e.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newPassword) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await authService.createUser({
        username: newUsername.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });

      if (res.success) {
        setCreateOpen(false);
        setNewUsername('');
        setNewEmail('');
        setNewPassword('Password@123');
        setNewRole('employee');
        setSuccessMsg(`Created user '${res.data.username}' successfully.`);
        setTimeout(() => setSuccessMsg(null), 3500);
        fetchUsers();
      }
    } catch (err) {
      const e = err as { message?: string };
      setErrorMsg(e.message || 'Failed to create user account');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            User Account & Role Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Configure RBAC roles, security privileges, MFA statuses, and account access.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<PersonAddOutlinedIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ fontWeight: 600 }}
          >
            Create User Account
          </Button>
        </Box>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Linked Personnel</TableCell>
              <TableCell>2FA / MFA</TableCell>
              <TableCell>Account Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No user accounts found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {u.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {u.email}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={u.role.toUpperCase()}
                      size="small"
                      color={ROLE_COLORS[u.role] || 'default'}
                      variant="filled"
                      sx={{ fontWeight: 700, fontSize: '0.72rem', height: 24 }}
                    />
                  </TableCell>

                  <TableCell>
                    {u.employee_details ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {u.employee_details.first_name} {u.employee_details.last_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {u.employee_details.job_title} • {u.employee_details.department_name}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        System / Unlinked
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    {u.mfa_enabled ? (
                      <Chip
                        icon={<VerifiedUserIcon sx={{ '&&': { fontSize: 16 } }} />}
                        label="Enabled"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 24, fontSize: '0.72rem' }}
                      />
                    ) : (
                      <Chip
                        label="Disabled"
                        size="small"
                        variant="outlined"
                        sx={{ height: 24, fontSize: '0.72rem', color: 'text.secondary' }}
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        size="small"
                        checked={u.is_active}
                        onChange={() => handleToggleStatus(u)}
                        color="success"
                      />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: u.is_active ? 'success.main' : 'text.disabled' }}>
                        {u.is_active ? 'Active' : 'Locked'}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Modify RBAC Role">
                      <IconButton size="small" onClick={() => handleOpenRoleDialog(u)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Role Change Modal */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Modify Account Role</DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Select the new permission level for <strong>{selectedUser?.username}</strong>:
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Role Level</InputLabel>
            <Select
              value={editRole}
              label="Role Level"
              onChange={(e) => setEditRole(e.target.value as UserRole)}
            >
              <MenuItem value="admin">Admin (Full System Privilege)</MenuItem>
              <MenuItem value="hr">HR (Personnel & Attendance Admin)</MenuItem>
              <MenuItem value="manager">Manager (Departmental Head)</MenuItem>
              <MenuItem value="team_lead">Team Lead (Team Presence & Staff)</MenuItem>
              <MenuItem value="employee">Employee (Individual Contributor)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setRoleDialogOpen(false)} size="small" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSaveRole}
            size="small"
            variant="contained"
            color="primary"
            disabled={actionLoading}
          >
            {actionLoading ? 'Saving...' : 'Apply Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New User Modal */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateUser}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
            <SecurityIcon color="primary" />
            Create Secure User Account
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Username"
              required
              fullWidth
              size="small"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. jdoe"
            />
            <TextField
              label="Email Address"
              type="email"
              required
              fullWidth
              size="small"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. jdoe@workforce.com"
            />
            <TextField
              label="Initial Temporary Password"
              required
              fullWidth
              size="small"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Min 8 characters with at least 1 uppercase letter and 1 number"
            />
            <FormControl fullWidth size="small" required>
              <InputLabel>Assigned Role</InputLabel>
              <Select
                value={newRole}
                label="Assigned Role"
                onChange={(e) => setNewRole(e.target.value as UserRole)}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="hr">HR</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="team_lead">Team Lead</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setCreateOpen(false)} size="small" variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              size="small"
              variant="contained"
              color="primary"
              disabled={actionLoading || !newUsername || !newEmail}
            >
              {actionLoading ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
