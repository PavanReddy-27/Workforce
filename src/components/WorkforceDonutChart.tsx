import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import PieChartOutlineOutlinedIcon from '@mui/icons-material/PieChartOutlineOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import type { DistributionSegment } from '../types';

interface WorkforceDonutChartProps {
  segments: DistributionSegment[];
  totalHeadcount: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: DistributionSegment;
  }>;
  isDark: boolean;
}

const CustomPieTooltip: React.FC<CustomTooltipProps> = ({ active, payload, isDark }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <Box
        sx={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0'}`,
          p: 1.25,
          borderRadius: '8px',
          boxShadow: isDark
            ? '0 8px 20px rgba(0, 0, 0, 0.4)'
            : '0 8px 20px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: item.color, fontSize: '0.8125rem' }}>
          {item.name}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 0.25, fontSize: '0.75rem' }}>
          Count: <strong>{item.value.toLocaleString()}</strong> ({item.percentage}%)
        </Typography>
      </Box>
    );
  }
  return null;
};

export const WorkforceDonutChart: React.FC<WorkforceDonutChartProps> = ({
  segments,
  totalHeadcount,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '6px',
                backgroundColor: alpha(theme.palette.info.main, isDark ? 0.2 : 0.1),
                color: theme.palette.info.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PieChartOutlineOutlinedIcon sx={{ fontSize: 17 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.2 }}>
                Workforce Status
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Contract & employment breakdown
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Donut Chart with Center Text */}
        <Box sx={{ position: 'relative', width: '100%', height: 200, my: 0.5, minWidth: 0, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
            <PieChart>
              <Tooltip content={<CustomPieTooltip isDark={isDark} />} />
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                stroke={isDark ? '#1E293B' : '#FFFFFF'}
                strokeWidth={2}
                isAnimationActive={false}
              >
                {segments.map((entry) => (
                  <Cell key={`cell-pie-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center Content */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
              {totalHeadcount.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.04em' }}>
              TOTAL EMPLOYEES
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Breakdown Legend Rows */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 'auto' }}>
          {segments.map((seg) => (
            <Box
              key={seg.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 0.35,
                px: 0.75,
                borderRadius: '6px',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <FiberManualRecordIcon sx={{ fontSize: 9, color: seg.color }} />
                <Typography variant="body2" sx={{ fontSize: '0.78125rem', fontWeight: 500 }}>
                  {seg.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" sx={{ fontSize: '0.78125rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {seg.value.toLocaleString()}
                </Typography>
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.15,
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    backgroundColor: alpha(seg.color, isDark ? 0.2 : 0.1),
                    color: seg.color,
                    minWidth: 42,
                    textAlign: 'center',
                  }}
                >
                  {seg.percentage}%
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default WorkforceDonutChart;
