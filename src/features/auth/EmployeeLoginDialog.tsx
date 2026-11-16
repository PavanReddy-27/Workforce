import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Button,
  InputAdornment,
  Box,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import type { DemoAccountFromSql, UserRole } from '../../types';

interface EmployeeLoginDialogProps {
  open: boolean;
  onClose: () => void;
  employees: DemoAccountFromSql[];
  onSelectEmployee: (emp: DemoAccountFromSql) => void;
}

const ROLE_COLORS: Record<UserRole, 'error' | 'primary' | 'warning' | 'info' | 'default'> = {
  admin: 'error',
  hr: 'primary',
  manager: 'warning',
  team_lead: 'info',
  employee: 'default',
};

export const EmployeeLoginDialog: React.FC<EmployeeLoginDialogProps> = ({
  open,
  onClose,
  employees,
  onSelectEmployee,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter(
      (emp) =>
        emp.label.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.roleDisplay.toLowerCase().includes(term) ||
        (emp.departmentName && emp.departmentName.toLowerCase().includes(term))
    );
  }, [employees, searchTerm]);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          py: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PeopleAltOutlinedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
              Employee Directory Logins
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
              Select any of the {employees.length} company employees to test their individual login
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name, department, or job title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: { borderRadius: '10px', fontSize: '0.875rem' },
            },
          }}
          sx={{ mb: 2 }}
        />

        <List
          sx={{
            maxHeight: 380,
            overflowY: 'auto',
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {filteredEmployees.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                No employees matching &quot;{searchTerm}&quot;
              </Typography>
            </Box>
          ) : (
            filteredEmployees.map((emp) => (
              <ListItem
                key={emp.email}
                onClick={() => {
                  onSelectEmployee(emp);
                  onClose();
                }}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  p: 1.25,
                  px: 2,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: '#2563eb',
                    backgroundColor: '#f8fafc',
                    transform: 'translateX(3px)',
                  },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                    }}
                  >
                    {getInitials(emp.label)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                        {emp.label}
                      </Typography>
                      <Chip
                        label={emp.role}
                        size="small"
                        color={ROLE_COLORS[emp.role] || 'default'}
                        sx={{ fontSize: '0.68rem', height: 20, textTransform: 'capitalize' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.25 }}>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {emp.roleDisplay} • {emp.departmentName || 'Staff'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {emp.email} • Pass: {emp.defaultPassword}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          startIcon={<CloseIcon />}
          sx={{ borderRadius: '8px', textTransform: 'none' }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
