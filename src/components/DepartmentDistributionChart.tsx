import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
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
  Legend,
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
              Headcount:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {item.headcount.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Open Roles:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#0284C7', fontVariantNumeric: 'tabular-nums' }}>
              +{item.openRoles} openings
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Satisfaction (eNPS):
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
              {item.satisfaction} / 100
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Budget Utilized:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {item.budget}%
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
  const [metricKey, setMetricKey] = useState<'headcount' | 'satisfaction'>('headcount');

  const totalHeadcount = data.reduce((acc, d) => acc + d.headcount, 0);
  const totalOpenRoles = data.reduce((acc, d) => acc + d.openRoles, 0);

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
              Staff headcount and open requisitions by organizational business unit
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={metricKey}
            exclusive
            size="small"
            onChange={(_, val) => {
              if (val) setMetricKey(val);
            }}
            sx={{
              backgroundColor: isDark ? alpha('#FFFFFF', 0.04) : alpha('#0F172A', 0.04),
              p: '2px',
              borderRadius: '6px',
              '& .MuiToggleButton-root': {
                border: 'none',
                px: 1.25,
                py: 0.35,
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'none',
                color: theme.palette.text.secondary,
                borderRadius: '4px !important',
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: '#FFFFFF',
                },
              },
            }}
          >
            <ToggleButton value="headcount">Headcount & Roles</ToggleButton>
            <ToggleButton value="satisfaction">Satisfaction</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Chart Canvas: expanded to 325px height to eliminate dead whitespace */}
        <Box sx={{ width: '100%', height: 325, minWidth: 0, minHeight: 0, my: 0.5 }}>
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
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: '0.78rem', fontWeight: 500 }}
                formatter={(value) => (
                  <span style={{ color: theme.palette.text.primary, marginRight: 14 }}>{value}</span>
                )}
              />

              {metricKey === 'headcount' ? (
                <>
                  <Bar
                    dataKey="headcount"
                    name="Current Staff"
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
                  <Bar
                    dataKey="openRoles"
                    name="Open Requisitions"
                    fill="#38BDF8"
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
                          key={`cell-roles-${entry.name}`}
                          fill={isHighlighted ? '#38BDF8' : alpha('#38BDF8', 0.25)}
                        />
                      );
                    })}
                  </Bar>
                </>
              ) : (
                <Bar
                  dataKey="satisfaction"
                  name="eNPS Satisfaction Score (0–100)"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  isAnimationActive={false}
                >
                  {data.map((entry) => (
                    <Cell
                      key={`cell-sat-${entry.name}`}
                      fill={entry.satisfaction >= 90 ? '#10B981' : entry.satisfaction >= 85 ? '#2563EB' : '#F59E0B'}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Footer info tip & compact summary indicators */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
            Tip: Click any bar to isolate department metrics across dashboard.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
              Total: <strong>{totalHeadcount.toLocaleString()}</strong> staff
            </Typography>
            <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600, fontSize: '0.75rem' }}>
              +{totalOpenRoles} Open Positions
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DepartmentDistributionChart;
