import React from 'react';
import { Box, Skeleton, Card } from '@mui/material';

export const LoadingSkeleton: React.FC = () => {
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* KPI Cards Skeletons */}
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
        }}
      >
        {[...Array(5)].map((_, i) => (
          <Card key={i} sx={{ p: 2.25, borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Skeleton variant="text" width="45%" height={16} />
              <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: '8px' }} />
            </Box>
            <Skeleton variant="text" width="55%" height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="70%" height={14} />
          </Card>
        ))}
      </Box>

      {/* Row 1 Skeletons (Attendance + Donut) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' },
          gap: 2.5,
        }}
      >
        <Card sx={{ p: 2.5, height: 400 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Skeleton variant="text" width={180} height={24} />
              <Skeleton variant="text" width={240} height={16} />
            </Box>
            <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={280} sx={{ borderRadius: 1 }} />
        </Card>

        <Card sx={{ p: 2.5, height: 400 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Skeleton variant="text" width={160} height={24} />
              <Skeleton variant="text" width={200} height={16} />
            </Box>
            <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <Skeleton variant="circular" width={180} height={180} />
          </Box>
          <Skeleton variant="text" width="100%" height={20} />
          <Skeleton variant="text" width="100%" height={20} />
        </Card>
      </Box>

      {/* Row 2 Skeletons (Department + Activity) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' },
          gap: 2.5,
        }}
      >
        <Card sx={{ p: 2.5, height: 420 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Skeleton variant="text" width={180} height={24} />
            <Skeleton variant="rectangular" width={140} height={32} sx={{ borderRadius: 1 }} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1 }} />
        </Card>

        <Card sx={{ p: 2.5, height: 420 }}>
          <Skeleton variant="text" width={160} height={24} sx={{ mb: 2 }} />
          {[...Array(4)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="60%" height={18} />
                <Skeleton variant="text" width="90%" height={14} />
              </Box>
            </Box>
          ))}
        </Card>
      </Box>
    </Box>
  );
};

export default LoadingSkeleton;
