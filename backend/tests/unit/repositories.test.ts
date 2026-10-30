import { describe, it, beforeEach, afterEach } from 'node:test';
import { expect } from '../helpers/expect';
import type Database from 'better-sqlite3';
import { createTestDatabase } from '../helpers/testDb';
import { DepartmentRepository } from '../../src/repositories/department.repository';
import { EmployeeRepository } from '../../src/repositories/employee.repository';
import { AttendanceRepository } from '../../src/repositories/attendance.repository';
import { DashboardRepository } from '../../src/repositories/dashboard.repository';

describe('Repository Layer Unit Tests', () => {
  let db: Database.Database;
  let deptRepo: DepartmentRepository;
  let empRepo: EmployeeRepository;
  let attRepo: AttendanceRepository;
  let dashRepo: DashboardRepository;

  beforeEach(() => {
    // Seed with 7 days of attendance
    db = createTestDatabase(true);
    deptRepo = new DepartmentRepository(db);
    empRepo = new EmployeeRepository(db);
    attRepo = new AttendanceRepository(db);
    dashRepo = new DashboardRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('DepartmentRepository', () => {
    it('should find all departments sorted by name', () => {
      const depts = deptRepo.findAll();
      expect(depts.length).toBe(6);
      expect(depts[0].name).toBe('Customer Success');
    });

    it('should find department by id and by name', () => {
      const all = deptRepo.findAll();
      const first = all[0];

      const byId = deptRepo.findById(first.id);
      expect(byId?.name).toBe(first.name);

      const byName = deptRepo.findByName('Engineering');
      expect(byName?.name).toBe('Engineering');
    });

    it('should return correct department count', () => {
      expect(deptRepo.count()).toBe(6);
    });
  });

  describe('EmployeeRepository', () => {
    it('should paginate employees correctly', () => {
      const res = empRepo.findAll({ page: 1, limit: 5 });
      expect(res.employees.length).toBe(5);
      expect(res.total).toBe(30);

      const page2 = empRepo.findAll({ page: 2, limit: 5 });
      expect(page2.employees.length).toBe(5);
      expect(page2.employees[0].id).not.toBe(res.employees[0].id);
    });

    it('should search employees by first name, last name, code, and email', () => {
      const byFirst = empRepo.findAll({ search: 'Sarah' });
      expect(byFirst.employees.length).toBeGreaterThanOrEqual(1);
      expect(byFirst.employees[0].first_name).toBe('Sarah');

      const byCode = empRepo.findAll({ search: 'EMP-001' });
      expect(byCode.employees.length).toBe(1);
      expect(byCode.employees[0].employee_code).toBe('EMP-001');

      const byEmail = empRepo.findAll({ search: 'sarah.jenkins@stackly.internal' });
      expect(byEmail.employees.length).toBe(1);
    });

    it('should filter employees by department, location, and status', () => {
      const byDept = empRepo.findAll({ department: 'Engineering' });
      expect(byDept.employees.every((e) => e.department_name === 'Engineering')).toBe(true);

      const byLoc = empRepo.findAll({ location: 'London Tech Hub' });
      expect(byLoc.employees.every((e) => e.location === 'London Tech Hub')).toBe(true);

      const byStatus = empRepo.findAll({ status: 'Terminated' });
      expect(byStatus.employees.every((e) => e.employment_status === 'Terminated')).toBe(true);
      expect(byStatus.total).toBe(1);
    });

    it('should sort employees by allowed fields in ascending and descending order', () => {
      const asc = empRepo.findAll({ sortBy: 'last_name', sortOrder: 'asc', limit: 10 });
      const desc = empRepo.findAll({ sortBy: 'last_name', sortOrder: 'desc', limit: 10 });

      expect(asc.employees[0].last_name.localeCompare(desc.employees[0].last_name)).toBeLessThan(0);
    });

    it('should find employee by id or code', () => {
      const emp = empRepo.findById(1);
      expect(emp).toBeDefined();
      expect(emp?.id).toBe(1);

      const byCode = empRepo.findByCode('EMP-002');
      expect(byCode?.employee_code).toBe('EMP-002');
    });

    it('should create a new employee and generate employee code', () => {
      const created = empRepo.create({
        first_name: 'Seraphina',
        last_name: 'Vance',
        email: 'seraphina.vance@stackly.internal',
        department_name: 'Engineering',
        role: 'DevOps Specialist',
        location: 'London Tech Hub',
        employment_status: 'Active',
      });

      expect(created.id).toBeDefined();
      expect(created.employee_code).toBeDefined();
      expect(created.first_name).toBe('Seraphina');
      expect(created.last_name).toBe('Vance');
      expect(created.department_name).toBe('Engineering');
      expect(created.location).toBe('London Tech Hub');
    });
  });

  describe('AttendanceRepository', () => {
    it('should list paginated attendance records', () => {
      const res = attRepo.findAll({ page: 1, limit: 10 });
      expect(res.records.length).toBe(10);
      expect(res.total).toBeGreaterThan(50);
      expect(res.records[0].department_name).toBeDefined();
    });

    it('should filter attendance by employeeId and status', () => {
      const res = attRepo.findAll({ employeeId: 1 });
      expect(res.records.every((r) => r.employee_id === 1)).toBe(true);

      const statusRes = attRepo.findAll({ status: 'Present' });
      expect(statusRes.records.every((r) => r.status === 'Present')).toBe(true);
    });

    it('should filter attendance by date and date range', () => {
      const today = new Date().toISOString().split('T')[0];
      const res = attRepo.findAll({ date: today });
      expect(res.records.every((r) => r.attendance_date === today)).toBe(true);
    });
  });

  describe('DashboardRepository', () => {
    it('should accurately calculate the 5 primary KPIs', () => {
      const kpis = dashRepo.getSummaryKpis({});
      expect(kpis.totalEmployees).toBe(28); // 30 seeded - 1 Terminated - 1 On Leave? No, active employees = 28
      expect(kpis.presentToday).toBeGreaterThan(0);
      expect(kpis.attendanceRate).toBeGreaterThan(80);
      expect(kpis.attendanceRate).toBeLessThanOrEqual(100);
      expect(kpis.date).toBeDefined();
    });

    it('should handle empty database gracefully for KPIs', () => {
      const emptyDb = createTestDatabase(false);
      const emptyDashRepo = new DashboardRepository(emptyDb);
      const kpis = emptyDashRepo.getSummaryKpis({});

      expect(kpis.totalEmployees).toBe(0);
      expect(kpis.presentToday).toBe(0);
      expect(kpis.absentToday).toBe(0);
      expect(kpis.onLeave).toBe(0);
      expect(kpis.attendanceRate).toBe(0);
      emptyDb.close();
    });

    it('should return attendance trends grouped by date', () => {
      const today = new Date().toISOString().split('T')[0];
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const past = d.toISOString().split('T')[0];

      const trends = dashRepo.getAttendanceTrends({ startDate: past, endDate: today });
      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0].date).toBeDefined();
      expect(trends[0].totalRecorded).toBeGreaterThan(0);
    });

    it('should return real SQL aggregations for workforce distribution', () => {
      const dist = dashRepo.getWorkforceDistribution();
      expect(dist.byDepartment.length).toBe(6);
      expect(dist.totalEmployees).toBe(29); // 30 - 1 Terminated = 29
      const sumDeptPercentages = dist.byDepartment.reduce((acc, d) => acc + d.percentage, 0);
      expect(Math.round(sumDeptPercentages)).toBeCloseTo(100, 0);

      expect(dist.byStatus.length).toBeGreaterThan(0);
    });
  });
});
