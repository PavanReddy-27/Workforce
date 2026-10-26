export interface FilterState {
  department: string;
  location: string;
  timeRange: '7d' | '30d' | '90d' | '1y';
  employmentType: string;
  searchQuery: string;
}

export interface KpiMetric {
  id: 'total_employees' | 'present_today' | 'absent_today' | 'attendance_rate' | 'on_leave';
  title: string;
  value: string;
  numericValue: number;
  change: number; // percentage change
  isPositive: boolean; // positive connotation
  period: string;
  subtitle: string;
  iconName: 'people' | 'check' | 'cancel' | 'trending_up' | 'event_busy';
  badgeColor: string;
}

export interface AttendanceDataPoint {
  date: string;
  inOffice: number;
  remote: number;
  onLeave: number;
  totalPresent: number;
  attendanceRate: number; // %
}

export interface DepartmentMetric {
  name: string;
  headcount: number;
  openRoles: number;
  satisfaction: number; // 0 - 100
  budget: number; // % utilized
  diversity: number; // % female/non-binary
  color: string;
}

export interface DistributionSegment {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface ActivityItem {
  id: string;
  type: 'hire' | 'promotion' | 'leave' | 'transfer' | 'anniversary';
  employeeName: string;
  role: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  timeAgo: string;
  status: 'completed' | 'pending' | 'approved';
}

export const DEPARTMENTS = [
  'All Departments',
  'Engineering',
  'Product & Design',
  'Sales & Marketing',
  'Customer Success',
  'Human Resources',
  'Finance & Legal',
];

export const LOCATIONS = [
  'All Locations',
  'San Francisco HQ',
  'London Tech Hub',
  'Singapore Office',
  'Remote Global',
];

export const TIME_RANGES: { label: string; value: FilterState['timeRange'] }[] = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last Quarter', value: '90d' },
  { label: 'Year to Date', value: '1y' },
];

export const EMPLOYMENT_TYPES = [
  'All Types',
  'Full-Time',
  'Contractor',
  'Part-Time',
  'Intern',
];

export const BASE_DEPARTMENTS: DepartmentMetric[] = [
  {
    name: 'Engineering',
    headcount: 512,
    openRoles: 16,
    satisfaction: 91,
    budget: 94,
    diversity: 42,
    color: '#2563EB',
  },
  {
    name: 'Product & Design',
    headcount: 184,
    openRoles: 6,
    satisfaction: 88,
    budget: 89,
    diversity: 54,
    color: '#0284C7',
  },
  {
    name: 'Sales & Marketing',
    headcount: 328,
    openRoles: 8,
    satisfaction: 85,
    budget: 96,
    diversity: 48,
    color: '#0D9488',
  },
  {
    name: 'Customer Success',
    headcount: 215,
    openRoles: 4,
    satisfaction: 89,
    budget: 87,
    diversity: 58,
    color: '#4F46E5',
  },
  {
    name: 'Human Resources',
    headcount: 78,
    openRoles: 2,
    satisfaction: 94,
    budget: 82,
    diversity: 68,
    color: '#D97706',
  },
  {
    name: 'Finance & Legal',
    headcount: 111,
    openRoles: 2,
    satisfaction: 92,
    budget: 91,
    diversity: 50,
    color: '#64748B',
  },
];

// Base total headcount: 512 + 184 + 328 + 215 + 78 + 111 = 1428
export const BASE_HEADCOUNT = 1428;

// Location proportions
export const LOCATION_WEIGHTS: Record<string, number> = {
  'San Francisco HQ': 0.42,
  'London Tech Hub': 0.28,
  'Singapore Office': 0.15,
  'Remote Global': 0.15,
};

// Employment type proportions
export const EMPLOYMENT_TYPE_WEIGHTS: Record<string, { share: number; color: string; label: string }> = {
  'Full-Time': { share: 0.68, color: '#2563EB', label: 'Full-Time' },
  'Contractor': { share: 0.18, color: '#0EA5E9', label: 'Contractor' },
  'Part-Time': { share: 0.09, color: '#10B981', label: 'Part-Time' },
  'Intern': { share: 0.05, color: '#F59E0B', label: 'Intern' },
};

export const RAW_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'hire',
    employeeName: 'Sarah Jenkins',
    role: 'Staff ML Infrastructure Engineer',
    department: 'Engineering',
    location: 'San Francisco HQ',
    employmentType: 'Full-Time',
    description: 'Completed technical onboarding and workstation setup',
    timeAgo: '18m ago',
    status: 'completed',
  },
  {
    id: 'act-2',
    type: 'promotion',
    employeeName: 'Marcus Chen',
    role: 'Promoted to Director of Product',
    department: 'Product & Design',
    location: 'San Francisco HQ',
    employmentType: 'Full-Time',
    description: 'Promoted following outstanding platform roadmap delivery',
    timeAgo: '1h ago',
    status: 'completed',
  },
  {
    id: 'act-3',
    type: 'transfer',
    employeeName: 'Elena Rostova',
    role: 'Senior Solutions Architect',
    department: 'Customer Success',
    location: 'Singapore Office',
    employmentType: 'Full-Time',
    description: 'Relocated from London Tech Hub to APAC regional hub',
    timeAgo: '3h ago',
    status: 'approved',
  },
  {
    id: 'act-4',
    type: 'leave',
    employeeName: 'David Kim',
    role: 'Lead UX Researcher',
    department: 'Product & Design',
    location: 'San Francisco HQ',
    employmentType: 'Full-Time',
    description: 'Paternity leave scheduled for Nov 01 – Dec 15',
    timeAgo: '5h ago',
    status: 'approved',
  },
  {
    id: 'act-5',
    type: 'anniversary',
    employeeName: 'Amara Okafor',
    role: 'VP of Global Talent',
    department: 'Human Resources',
    location: 'London Tech Hub',
    employmentType: 'Full-Time',
    description: 'Celebrating 5 years milestone at the organization',
    timeAgo: 'Yesterday',
    status: 'completed',
  },
  {
    id: 'act-6',
    type: 'hire',
    employeeName: 'Liam O’Connor',
    role: 'Senior DevOps Architect',
    department: 'Engineering',
    location: 'Remote Global',
    employmentType: 'Contractor',
    description: 'Contract engagement approved for cloud modernization',
    timeAgo: 'Yesterday',
    status: 'pending',
  },
  {
    id: 'act-7',
    type: 'leave',
    employeeName: 'Priya Sharma',
    role: 'Financial Analyst',
    department: 'Finance & Legal',
    location: 'London Tech Hub',
    employmentType: 'Full-Time',
    description: 'Annual medical leave approved by department head',
    timeAgo: '2d ago',
    status: 'approved',
  },
  {
    id: 'act-8',
    type: 'hire',
    employeeName: 'Alex Rivera',
    role: 'Growth Marketing Associate',
    department: 'Sales & Marketing',
    location: 'San Francisco HQ',
    employmentType: 'Part-Time',
    description: 'Joined demand generation and campaign team',
    timeAgo: '3d ago',
    status: 'completed',
  },
];

/**
 * Deterministic helper that computes completely synchronized dashboard data
 * for any combination of filters.
 */
export function getFilteredWorkforceData(filters: FilterState) {
  // 1. Department filtering & scaling
  let baseTotal = BASE_HEADCOUNT;

  if (filters.department !== 'All Departments') {
    const matched = BASE_DEPARTMENTS.find((d) => d.name === filters.department);
    baseTotal = matched ? matched.headcount : BASE_HEADCOUNT;
  }

  // 2. Location scaling factor
  let locFactor = 1.0;
  if (filters.location !== 'All Locations') {
    locFactor = LOCATION_WEIGHTS[filters.location] ?? 0.25;
  }

  // 3. Employment type scaling factor
  let empFactor = 1.0;
  if (filters.employmentType !== 'All Types') {
    empFactor = EMPLOYMENT_TYPE_WEIGHTS[filters.employmentType]?.share ?? 0.5;
  }

  // Effective total headcount
  const totalHeadcount = Math.max(12, Math.round(baseTotal * locFactor * empFactor));

  // If a single department is selected, adjust the department metrics display
  const departmentChartData = BASE_DEPARTMENTS.map((dept) => {
    const scale = (locFactor * empFactor);
    return {
      ...dept,
      headcount: Math.max(2, Math.round(dept.headcount * scale)),
      openRoles: Math.max(0, Math.round(dept.openRoles * scale)),
    };
  });

  // Calculate the 5 required primary KPIs with strict mathematical consistency:
  // Total Employees = Present Today + Absent Today + On Leave
  // Baseline: Total = 1,428, On Leave = 72 (~5.0%), Scheduled = 1,356
  // Attendance Rate = Present / Scheduled = 95.2% -> Present = 1,291, Absent = 65
  // Check: 1,291 + 65 + 72 = 1,428. Rate = (1,291 / 1,356) * 100 = 95.2%
  const onLeave = Math.max(1, Math.round(totalHeadcount * 0.0504));
  const scheduledHeadcount = Math.max(1, totalHeadcount - onLeave);
  const presentToday = Math.round(scheduledHeadcount * 0.952);
  const absentToday = totalHeadcount - onLeave - presentToday;
  const attendanceRate = Number(((presentToday / scheduledHeadcount) * 100).toFixed(1));

  const totalOpenRoles = departmentChartData.reduce((acc, d) => acc + d.openRoles, 0);

  const kpis: KpiMetric[] = [
    {
      id: 'total_employees',
      title: 'Total Employees',
      value: totalHeadcount.toLocaleString(),
      numericValue: totalHeadcount,
      change: 5.4,
      isPositive: true,
      period: 'vs last month',
      subtitle: `${totalOpenRoles} open requisitions across departments`,
      iconName: 'people',
      badgeColor: '#2563EB',
    },
    {
      id: 'present_today',
      title: 'Present Today',
      value: presentToday.toLocaleString(),
      numericValue: presentToday,
      change: 2.1,
      isPositive: true,
      period: 'vs yesterday',
      subtitle: `${Math.round(presentToday * 0.46).toLocaleString()} on-site, ${Math.round(presentToday * 0.54).toLocaleString()} remote`,
      iconName: 'check',
      badgeColor: '#10B981',
    },
    {
      id: 'absent_today',
      title: 'Absent Today',
      value: absentToday.toLocaleString(),
      numericValue: absentToday,
      change: -0.6,
      isPositive: true, // Lower absence is positive
      period: 'vs 30d avg (4.8%)',
      subtitle: 'Unplanned or unexcused absences',
      iconName: 'cancel',
      badgeColor: '#EF4444',
    },
    {
      id: 'attendance_rate',
      title: 'Attendance Rate',
      value: `${attendanceRate}%`,
      numericValue: attendanceRate,
      change: 1.2,
      isPositive: true,
      period: 'vs 92.0% target',
      subtitle: `${presentToday.toLocaleString()} of ${scheduledHeadcount.toLocaleString()} scheduled staff`,
      iconName: 'trending_up',
      badgeColor: '#10B981',
    },
    {
      id: 'on_leave',
      title: 'On Leave',
      value: onLeave.toLocaleString(),
      numericValue: onLeave,
      change: 0.0,
      isPositive: true,
      period: 'approved calendar',
      subtitle: 'PTO, parental & scheduled medical',
      iconName: 'event_busy',
      badgeColor: '#F59E0B',
    },
  ];

  // 4. Workforce Donut Composition (Full-Time, Contractor, Part-Time, Intern)
  // Segments must sum up EXACTLY to totalHeadcount!
  let fullTime = Math.round(totalHeadcount * 0.68);
  let contractor = Math.round(totalHeadcount * 0.18);
  let partTime = Math.round(totalHeadcount * 0.09);
  let intern = totalHeadcount - (fullTime + contractor + partTime);

  // If filtered to a specific employment type, reflect that clearly
  if (filters.employmentType !== 'All Types') {
    if (filters.employmentType === 'Full-Time') {
      fullTime = totalHeadcount;
      contractor = 0;
      partTime = 0;
      intern = 0;
    } else if (filters.employmentType === 'Contractor') {
      fullTime = 0;
      contractor = totalHeadcount;
      partTime = 0;
      intern = 0;
    } else if (filters.employmentType === 'Part-Time') {
      fullTime = 0;
      contractor = 0;
      partTime = totalHeadcount;
      intern = 0;
    } else if (filters.employmentType === 'Intern') {
      fullTime = 0;
      contractor = 0;
      partTime = 0;
      intern = totalHeadcount;
    }
  }

  const workforceDonutSegments: DistributionSegment[] = [
    {
      name: 'Full-Time Regular',
      value: fullTime,
      color: '#2563EB',
      percentage: totalHeadcount > 0 ? Number(((fullTime / totalHeadcount) * 100).toFixed(1)) : 0,
    },
    {
      name: 'Contractor / Agency',
      value: contractor,
      color: '#0EA5E9',
      percentage: totalHeadcount > 0 ? Number(((contractor / totalHeadcount) * 100).toFixed(1)) : 0,
    },
    {
      name: 'Part-Time',
      value: partTime,
      color: '#10B981',
      percentage: totalHeadcount > 0 ? Number(((partTime / totalHeadcount) * 100).toFixed(1)) : 0,
    },
    {
      name: 'Interns & Fellows',
      value: intern,
      color: '#F59E0B',
      percentage: totalHeadcount > 0 ? Number(((intern / totalHeadcount) * 100).toFixed(1)) : 0,
    },
  ];

  // 5. Attendance Trend Data Points across Time Range
  // Scale each point based on the current filtered totalHeadcount
  const trendPoints: AttendanceDataPoint[] = [];

  if (filters.timeRange === '7d') {
    const days = [
      { label: 'Mon', inRatio: 0.44, remRatio: 0.49, leaveRatio: 0.05 },
      { label: 'Tue', inRatio: 0.48, remRatio: 0.46, leaveRatio: 0.05 },
      { label: 'Wed', inRatio: 0.51, remRatio: 0.44, leaveRatio: 0.04 },
      { label: 'Thu', inRatio: 0.47, remRatio: 0.47, leaveRatio: 0.05 },
      { label: 'Fri', inRatio: 0.38, remRatio: 0.54, leaveRatio: 0.06 },
      { label: 'Sat', inRatio: 0.05, remRatio: 0.07, leaveRatio: 0.88 },
      { label: 'Sun', inRatio: 0.04, remRatio: 0.06, leaveRatio: 0.90 },
    ];
    days.forEach((d) => {
      const inOff = Math.round(totalHeadcount * d.inRatio);
      const rem = Math.round(totalHeadcount * d.remRatio);
      const lve = Math.round(totalHeadcount * d.leaveRatio);
      const pres = inOff + rem;
      const scheduled = Math.max(1, totalHeadcount - lve);
      const rate = Number(((pres / scheduled) * 100).toFixed(1));
      trendPoints.push({
        date: d.label,
        inOffice: inOff,
        remote: rem,
        onLeave: lve,
        totalPresent: pres,
        attendanceRate: Math.min(99.5, Math.max(75, rate)),
      });
    });
  } else if (filters.timeRange === '30d') {
    const weeks = [
      { label: 'Week 1', inRatio: 0.44, remRatio: 0.50, leaveRatio: 0.05 },
      { label: 'Week 2', inRatio: 0.46, remRatio: 0.49, leaveRatio: 0.05 },
      { label: 'Week 3', inRatio: 0.48, remRatio: 0.48, leaveRatio: 0.04 },
      { label: 'Week 4', inRatio: 0.45, remRatio: 0.50, leaveRatio: 0.05 },
    ];
    weeks.forEach((w) => {
      const inOff = Math.round(totalHeadcount * w.inRatio);
      const rem = Math.round(totalHeadcount * w.remRatio);
      const lve = Math.round(totalHeadcount * w.leaveRatio);
      const pres = inOff + rem;
      const scheduled = Math.max(1, totalHeadcount - lve);
      const rate = Number(((pres / scheduled) * 100).toFixed(1));
      trendPoints.push({
        date: w.label,
        inOffice: inOff,
        remote: rem,
        onLeave: lve,
        totalPresent: pres,
        attendanceRate: Math.min(99.5, Math.max(85, rate)),
      });
    });
  } else if (filters.timeRange === '90d') {
    const months = [
      { label: 'Aug', inRatio: 0.43, remRatio: 0.51, leaveRatio: 0.05 },
      { label: 'Sep', inRatio: 0.45, remRatio: 0.50, leaveRatio: 0.05 },
      { label: 'Oct', inRatio: 0.47, remRatio: 0.48, leaveRatio: 0.05 },
    ];
    months.forEach((m) => {
      const inOff = Math.round(totalHeadcount * m.inRatio);
      const rem = Math.round(totalHeadcount * m.remRatio);
      const lve = Math.round(totalHeadcount * m.leaveRatio);
      const pres = inOff + rem;
      const scheduled = Math.max(1, totalHeadcount - lve);
      const rate = Number(((pres / scheduled) * 100).toFixed(1));
      trendPoints.push({
        date: m.label,
        inOffice: inOff,
        remote: rem,
        onLeave: lve,
        totalPresent: pres,
        attendanceRate: Math.min(99.5, Math.max(85, rate)),
      });
    });
  } else {
    // 1y
    const quarters = [
      { label: 'Q1', inRatio: 0.42, remRatio: 0.51, leaveRatio: 0.06 },
      { label: 'Q2', inRatio: 0.45, remRatio: 0.49, leaveRatio: 0.05 },
      { label: 'Q3', inRatio: 0.46, remRatio: 0.49, leaveRatio: 0.05 },
      { label: 'Q4 (YTD)', inRatio: 0.47, remRatio: 0.48, leaveRatio: 0.05 },
    ];
    quarters.forEach((q) => {
      const inOff = Math.round(totalHeadcount * q.inRatio);
      const rem = Math.round(totalHeadcount * q.remRatio);
      const lve = Math.round(totalHeadcount * q.leaveRatio);
      const pres = inOff + rem;
      const scheduled = Math.max(1, totalHeadcount - lve);
      const rate = Number(((pres / scheduled) * 100).toFixed(1));
      trendPoints.push({
        date: q.label,
        inOffice: inOff,
        remote: rem,
        onLeave: lve,
        totalPresent: pres,
        attendanceRate: Math.min(99.5, Math.max(85, rate)),
      });
    });
  }

  // 6. Filter activities by current filter state
  let filteredActivities = RAW_ACTIVITIES;
  if (filters.department !== 'All Departments') {
    filteredActivities = filteredActivities.filter((a) => a.department === filters.department);
  }
  if (filters.location !== 'All Locations') {
    filteredActivities = filteredActivities.filter((a) => a.location === filters.location);
  }
  if (filters.employmentType !== 'All Types') {
    filteredActivities = filteredActivities.filter((a) => a.employmentType === filters.employmentType);
  }
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    filteredActivities = filteredActivities.filter(
      (a) =>
        a.employeeName.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q)
    );
  }

  return {
    totalHeadcount,
    kpis,
    trendPoints,
    departmentChartData,
    workforceDonutSegments,
    filteredActivities,
  };
}
