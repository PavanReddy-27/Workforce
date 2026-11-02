import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  useTheme,
  alpha,
  Divider,
  Chip,
} from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import type { DepartmentMetric } from '../types';

interface DepartmentDistributionChartProps {
  data: DepartmentMetric[];
  selectedDepartment: string;
  onSelectDepartment: (deptName: string) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: DepartmentMetric;
  }>;
  isDark: boolean;
}

const CustomBarTooltip: React.FC<CustomTooltipProps> = ({ active, payload, isDark }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <Box
        sx={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0'}`,
          p: 1.5,
          borderRadius: '8px',
          boxShadow: isDark
            ? '0 8px 24px rgba(0, 0, 0, 0.45)'
            : '0 8px 24px rgba(15, 23, 42, 0.08)',
          minWidth: 195,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, color: item.color, fontSize: '0.8125rem' }}>
          {item.name}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Employees:
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {item.headcount.toLocaleString()}
          </Typography>
        </Box>
        </Box>
      </Box>
    );
  }
  return null;
};

export const DepartmentDistributionChart: React.FC<DepartmentDistributionChartProps> = ({
  data,
  selectedDepartment,
  onSelectDepartment,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const totalHeadcount = data.reduce((acc, d) => acc + d.headcount, 0);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1.5,
            mb: 1.5,
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
                <BarChartOutlinedIcon sx={{ fontSize: 17 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                Department Distribution
              </Typography>
              {selectedDepartment !== 'All Departments' && (
                <Chip
                  label={`Filtered: ${selectedDepartment}`}
                  size="small"
                  color="primary"
                  onDelete={() => onSelectDepartment('All Departments')}
                  sx={{ height: 22, fontSize: '0.6875rem' }}
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.25, display: 'block' }}>
              Employee headcount by department
            </Typography>
          </Box>
        </Box>

        {/* Chart Canvas: expanded to 325px height to eliminate dead whitespace */}
        <Box sx={{ width: '100%', height: 325, minWidth: 0, minHeight: 0, my: 0.5 }}>
          {!data || data.length === 0 ? (
            <Box
              sx={{
                height: 325,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
                gap: 1,
              }}
            >
              <BarChartOutlinedIcon sx={{ fontSize: 40, opacity: 0.3 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                No department distribution data available.
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Adjust or reset active filters to view department breakdowns.
              </Typography>
            </Box>
          ) : (
          <ResponsiveContainer width="100%" height={325} minWidth={0} minHeight={0}>
            <BarChart
              data={data}
              margin={{ top: 12, right: 16, left: 4, bottom: 4 }}
              onClick={(state) => {
                if (state && state.activeLabel !== undefined) {
                  const label = String(state.activeLabel);
                  onSelectDepartment(
                    selectedDepartment === label ? 'All Departments' : label
                  );
                }
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.07)'}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={{ stroke: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)' }}
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              />
              <YAxis
                width={45}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => Number(val).toLocaleString()}
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              />
              <Tooltip content={<CustomBarTooltip isDark={isDark} />} />
              <Bar
                dataKey="headcount"
                name="Employees"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                isAnimationActive={false}
              >
                {data.map((entry) => {
                  const isHighlighted =
                    selectedDepartment === 'All Departments' ||
                    selectedDepartment === entry.name;
                  return (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={isHighlighted ? '#2563EB' : alpha('#2563EB', 0.25)}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Footer info tip & compact summary indicators */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
            Tip: Click any bar to filter the dashboard by department.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
              Total: <strong>{totalHeadcount.toLocaleString()}</strong> staff
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DepartmentDistributionChart;
