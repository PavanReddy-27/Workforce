import { describe, it } from 'node:test';
import { expect } from '../helpers/expect';
import {
  calculateDateRange,
  transformSummaryToKpis,
  transformAttendanceTrends,
  transformDistribution,
} from '../../src/services/dashboard.service';
import type {
  BackendDashboardSummary,
  BackendAttendanceTrendItem,
  BackendWorkforceDistribution,
} from '../../src/types';

describe('Dashboard Service & Transform Unit Tests', () => {
  it('should calculate accurate date ranges', () => {
    const anchor = '2026-10-30';
    const range7d = calculateDateRange('7d', anchor);
    expect(range7d.endDate).toBe('2026-10-30');
    expect(range7d.startDate).toBe('2026-10-23');

    const range30d = calculateDateRange('30d', anchor);
    expect(range30d.endDate).toBe('2026-10-30');
    expect(range30d.startDate).toBe('2026-09-30');

    const range90d = calculateDateRange('90d', anchor);
    expect(range90d.endDate).toBe('2026-10-30');
    expect(range90d.startDate).toBe('2026-08-01');

    const range1y = calculateDateRange('1y', anchor);
    expect(range1y.endDate).toBe('2026-10-30');
    expect(range1y.startDate).toBe('2025-10-30');
  });

  it('should transform backend summary into the 5 required KPI cards', () => {
    const summary: BackendDashboardSummary = {
      totalEmployees: 30,
      presentToday: 26,
      absentToday: 1,
      onLeave: 1,
      attendanceRate: 92.9,
      date: '2026-10-30',
      filtersApplied: {},
    };

    const kpis = transformSummaryToKpis(summary);
    expect(kpis.length).toBe(5);

    // 1. Total Employees
    expect(kpis[0].id).toBe('total_employees');
    expect(kpis[0].title).toBe('Total Employees');
    expect(kpis[0].value).toBe('30');
    expect(kpis[0].numericValue).toBe(30);
    expect(kpis[0].change).toBeUndefined(); // No fake comparison percentage

    // 2. Present Today
    expect(kpis[1].id).toBe('present_today');
    expect(kpis[1].value).toBe('26');
    expect(kpis[1].period).toContain('2026-10-30');

    // 3. Absent Today
    expect(kpis[2].id).toBe('absent_today');
    expect(kpis[2].value).toBe('1');
    expect(kpis[2].isPositive).toBe(false);

    // 4. Attendance Rate
    expect(kpis[3].id).toBe('attendance_rate');
    expect(kpis[3].value).toBe('92.9%');
    expect(kpis[3].numericValue).toBe(92.9);

    // 5. On Leave
    expect(kpis[4].id).toBe('on_leave');
    expect(kpis[4].value).toBe('1');
  });

  it('should handle zero and empty database state gracefully for KPIs', () => {
    const emptySummary: BackendDashboardSummary = {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      onLeave: 0,
      attendanceRate: 0,
      date: '2026-10-30',
      filtersApplied: {},
    };

    const kpis = transformSummaryToKpis(emptySummary);
    expect(kpis.length).toBe(5);
    expect(kpis[0].value).toBe('0');
    expect(kpis[3].value).toBe('0%');
    expect(kpis[3].numericValue).toBe(0);
  });

  it('should transform attendance trends preserving recorded attendance statuses', () => {
    const rawTrends: BackendAttendanceTrendItem[] = [
      {
        date: '2026-10-29',
        present: 27,
        absent: 1,
        onLeave: 0,
        totalRecorded: 28,
        attendanceRate: 96.4,
      },
      {
        date: '2026-10-30',
        present: 26,
        absent: 1,
        onLeave: 1,
        totalRecorded: 28,
        attendanceRate: 92.9,
      },
    ];

    const chartPoints = transformAttendanceTrends(rawTrends);
    expect(chartPoints.length).toBe(2);
    expect(chartPoints[0].date).toBe('2026-10-29');
    expect(chartPoints[0].present).toBe(27);
    expect(chartPoints[0].absent).toBe(1);
    expect(chartPoints[0].onLeave).toBe(0);
    expect(chartPoints[0].attendanceRate).toBe(96.4);
  });

  it('should transform workforce distribution into department and status models', () => {
    const rawDist: BackendWorkforceDistribution = {
      byDepartment: [
        { departmentId: 1, departmentName: 'Engineering', headcount: 10, percentage: 33.3 },
        { departmentId: 2, departmentName: 'Product & Design', headcount: 5, percentage: 16.7 },
      ],
      byStatus: [
        { status: 'Active', count: 28, percentage: 93.3 },
        { status: 'On Leave', count: 1, percentage: 3.3 },
        { status: 'Terminated', count: 1, percentage: 3.3 },
      ],
      totalEmployees: 30,
    };

    const { departmentChartData, workforceDonutSegments } = transformDistribution(rawDist);

    expect(departmentChartData.length).toBe(2);
    expect(departmentChartData[0].name).toBe('Engineering');
    expect(departmentChartData[0].headcount).toBe(10);
    expect(departmentChartData[0].color).toBe('#2563EB');

    expect(workforceDonutSegments.length).toBe(3);
    expect(workforceDonutSegments[0].name).toBe('Active');
    expect(workforceDonutSegments[0].value).toBe(28);
    expect(workforceDonutSegments[0].percentage).toBe(93.3);
    expect(workforceDonutSegments[0].color).toBe('#10B981');
    expect(workforceDonutSegments.reduce((total, segment) => total + segment.value, 0)).toBe(
      rawDist.totalEmployees
    );
  });
});
