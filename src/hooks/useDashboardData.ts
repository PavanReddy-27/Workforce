/**
 * Custom hook for Dashboard Data Orchestration
 * Decouples presentation from data access. Currently synchronizes from mock/computation data,
 * ready to seamlessly transition to asynchronous API queries in Sprint 3.
 */

import { useMemo } from 'react';
import type { FilterState, DashboardSummary } from '../types';
import { getFilteredWorkforceData } from '../data/mockData';

export function useDashboardData(filters: FilterState): DashboardSummary {
  return useMemo(() => {
    const data = getFilteredWorkforceData(filters);
    return {
      totalHeadcount: data.totalHeadcount,
      kpis: data.kpis,
      trendPoints: data.trendPoints,
      departmentChartData: data.departmentChartData,
      workforceDonutSegments: data.workforceDonutSegments,
      filteredActivities: data.filteredActivities,
    };
  }, [filters]);
}
