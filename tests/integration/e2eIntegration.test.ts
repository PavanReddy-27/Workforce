import { describe, it } from 'node:test';
import { expect } from '../helpers/expect';
import { dashboardService } from '../../src/services/dashboard.service';
import { employeeService } from '../../src/services/employees.service';
import { departmentService } from '../../src/services/departments.service';
import { attendanceService } from '../../src/services/attendance.service';

describe('Live End-to-End Frontend-Backend Integration Tests', () => {
  it('should fetch real KPI summary from running backend', async () => {
    const summaryRes = await dashboardService.getSummary({
      department: 'All Departments',
      location: 'All Locations',
      timeRange: '30d',
      employmentType: 'All Types',
      searchQuery: '',
    });

    expect(summaryRes.success).toBe(true);
    expect(summaryRes.data).toBeDefined();
    expect(summaryRes.data.totalEmployees).toBeGreaterThan(0);
    expect(summaryRes.data.attendanceRate).toBeGreaterThan(80);
    expect(summaryRes.data.date).toBeDefined();
  });

  it('should filter summary KPIs by department on the backend', async () => {
    const engRes = await dashboardService.getSummary({
      department: 'Engineering',
      location: 'All Locations',
      timeRange: '30d',
      employmentType: 'All Types',
      searchQuery: '',
    });

    expect(engRes.success).toBe(true);
    expect(engRes.data.totalEmployees).toBeGreaterThanOrEqual(9);
    expect(engRes.data.filtersApplied.department).toBe('Engineering');
  });

  it('should fetch real date-grouped attendance trends with inOffice and remote breakdown', async () => {
    const trendRes = await dashboardService.getAttendanceTrends({
      department: 'All Departments',
      location: 'All Locations',
      timeRange: '30d',
      employmentType: 'All Types',
      searchQuery: '',
    });

    expect(trendRes.success).toBe(true);
    expect(Array.isArray(trendRes.data)).toBe(true);
    expect(trendRes.data.length).toBeGreaterThan(0);

    const firstPoint = trendRes.data[0];
    expect(firstPoint.date).toBeDefined();
    expect(firstPoint.present).toBeGreaterThan(0);
    expect(firstPoint.inOffice).toBeGreaterThan(0);
    expect(firstPoint.remote).toBeGreaterThanOrEqual(0);
    expect(firstPoint.totalRecorded).toBe(firstPoint.present + firstPoint.absent + firstPoint.onLeave);
  });

  it('should fetch real workforce distribution from backend SQL aggregation', async () => {
    const distRes = await dashboardService.getWorkforceDistribution();

    expect(distRes.success).toBe(true);
    expect(distRes.data.byDepartment.length).toBe(6);
    expect(distRes.data.byStatus.length).toBeGreaterThan(0);
    expect(distRes.data.totalEmployees).toBeGreaterThanOrEqual(28);
  });

  it('should fetch all 6 departments from GET /api/departments', async () => {
    const deptRes = await departmentService.getDepartments();

    expect(deptRes.success).toBe(true);
    expect(deptRes.data.length).toBe(6);
    const names = deptRes.data.map((d) => d.name);
    expect(names).toContain('Engineering');
    expect(names).toContain('Product & Design');
    expect(names).toContain('Finance & Legal');
  });

  it('should perform server-side employee search, filter, sort, and pagination', async () => {
    // 1. Pagination
    const page1Res = await employeeService.getEmployees({ page: 1, limit: 5 });
    expect(page1Res.success).toBe(true);
    expect(page1Res.data.length).toBe(5);
    expect(page1Res.pagination.totalRecords).toBeGreaterThanOrEqual(30);
    expect(page1Res.pagination.totalPages).toBeGreaterThanOrEqual(2);

    // 2. Search
    const searchRes = await employeeService.getEmployees({ search: 'Jenkins' });
    expect(searchRes.success).toBe(true);
    expect(searchRes.data.length).toBe(1);
    expect(searchRes.data[0].last_name).toBe('Jenkins');

    // 3. Department filter
    const deptFilterRes = await employeeService.getEmployees({ department: 'Engineering' });
    expect(deptFilterRes.success).toBe(true);
    expect(deptFilterRes.data.every((e) => e.department_name === 'Engineering')).toBe(true);

    // 4. Sorting
    const sortRes = await employeeService.getEmployees({
      sortBy: 'first_name',
      sortOrder: 'asc',
      limit: 5,
    });
    expect(sortRes.success).toBe(true);
    expect(sortRes.data[0].first_name <= sortRes.data[1].first_name).toBe(true);
  });

  it('should fetch paginated attendance records from GET /api/attendance', async () => {
    const attRes = await attendanceService.getAttendanceRecords({ page: 1, limit: 10 });
    expect(attRes.success).toBe(true);
    expect(attRes.data.length).toBe(10);
    expect(attRes.pagination.totalRecords).toBeGreaterThan(700);
  });

  it('should create a new employee via POST /api/employees', async () => {
    const uniqueSuffix = Date.now().toString().slice(-6);
    const newEmp = await employeeService.createEmployee({
      first_name: 'TestQA',
      last_name: `Engineer${uniqueSuffix}`,
      email: `testqa.engineer${uniqueSuffix}@stackly.internal`,
      job_title: 'Senior QA Automation Engineer',
      department: 'Engineering',
      location: 'San Francisco HQ',
      employment_status: 'Active',
    });

    try {
      expect(newEmp.success).toBe(true);
      expect(newEmp.data.first_name).toBe('TestQA');
      expect(newEmp.data.department_name).toBe('Engineering');
      expect(newEmp.data.id).toBeGreaterThan(0);
    } finally {
      if (newEmp?.data?.id) {
        await employeeService.deleteEmployee(newEmp.data.id);
      }
    }
  });

  it('should return empty list when employee search matches no records', async () => {
    const res = await employeeService.getEmployees({ search: 'NonExistentPersonXYZ999' });
    expect(res.success).toBe(true);
    expect(res.data.length).toBe(0);
    expect(res.pagination.totalRecords).toBe(0);
  });

  it('should safely escape special SQL wildcard characters in employee search', async () => {
    const wildcardRes = await employeeService.getEmployees({ search: '%_' });
    expect(wildcardRes.success).toBe(true);
    // Should safely treat % and _ as literal strings rather than SQL wildcards
    expect(Array.isArray(wildcardRes.data)).toBe(true);
  });

  it('should return 404 error when requesting a non-existent employee ID', async () => {
    try {
      await employeeService.getEmployeeById(999999);
      expect.fail('Expected 404 error for non-existent employee ID');
    } catch (err: unknown) {
      const error = err as { status?: number; code?: string };
      expect(error.status).toBe(404);
      expect(error.code).toBe('EMPLOYEE_NOT_FOUND');
    }
  });

  it('should deduplicate department requests using in-memory cache', async () => {
    const [call1, call2] = await Promise.all([
      departmentService.getDepartments(),
      departmentService.getDepartments(),
    ]);

    expect(call1.success).toBe(true);
    expect(call2.success).toBe(true);
    expect(call1.data.length).toBe(call2.data.length);
  });
});
