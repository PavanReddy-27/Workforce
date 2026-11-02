import Database from 'better-sqlite3';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from '../../src/database/schema';
import { seedDatabase } from '../../src/database/seed';
import { DepartmentRepository } from '../../src/repositories/department.repository';
import { EmployeeRepository } from '../../src/repositories/employee.repository';
import { AttendanceRepository } from '../../src/repositories/attendance.repository';
import { DashboardRepository } from '../../src/repositories/dashboard.repository';
import { DepartmentService } from '../../src/services/department.service';
import { EmployeeService } from '../../src/services/employee.service';
import { AttendanceService } from '../../src/services/attendance.service';
import { DashboardService } from '../../src/services/dashboard.service';
import { HealthController } from '../../src/controllers/health.controller';
import { DepartmentController } from '../../src/controllers/department.controller';
import { EmployeeController } from '../../src/controllers/employee.controller';
import { AttendanceController } from '../../src/controllers/attendance.controller';
import { DashboardController } from '../../src/controllers/dashboard.controller';
import { validateRequest } from '../../src/middleware/validateRequest';
import { notFoundHandler } from '../../src/middleware/notFoundHandler';
import { errorHandler } from '../../src/middleware/errorHandler';
import {
  getEmployeesQuerySchema,
  getEmployeeByIdParamsSchema,
  createEmployeeBodySchema,
} from '../../src/schemas/employee.schema';
import { getAttendanceQuerySchema } from '../../src/schemas/attendance.schema';
import {
  getDashboardSummaryQuerySchema,
  getDashboardAttendanceQuerySchema,
  getDashboardDistributionQuerySchema,
} from '../../src/schemas/dashboard.schema';

/**
 * Creates an isolated in-memory SQLite database for tests.
 */
export const createTestDatabase = (withSeed = false): Database.Database => {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  initializeDatabase(db);

  if (withSeed) {
    seedDatabase({ db, daysBack: 7, quiet: true });
  }

  return db;
};

/**
 * Creates an Express test app wired with repositories using the provided test database.
 */
export const createTestApp = (db: Database.Database): Express => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Instantiate repos and services bound to test db
  const deptRepo = new DepartmentRepository(db);
  const empRepo = new EmployeeRepository(db);
  const attRepo = new AttendanceRepository(db);
  const dashRepo = new DashboardRepository(db);

  const deptService = new DepartmentService(deptRepo);
  const empService = new EmployeeService(empRepo);
  const attService = new AttendanceService(attRepo);
  const dashService = new DashboardService(dashRepo);

  const healthCtrl = new HealthController();
  const deptCtrl = new DepartmentController(deptService);
  const empCtrl = new EmployeeController(empService);
  const attCtrl = new AttendanceController(attService);
  const dashCtrl = new DashboardController(dashService);

  // Health
  app.get('/api/health', healthCtrl.getHealth);

  // Departments
  app.get('/api/departments', deptCtrl.getDepartments);

  // Employees
  app.get(
    '/api/employees',
    validateRequest({ query: getEmployeesQuerySchema }),
    empCtrl.getEmployees
  );
  app.get('/api/employees/locations', empCtrl.getLocations);
  app.get(
    '/api/employees/:id',
    validateRequest({ params: getEmployeeByIdParamsSchema }),
    empCtrl.getEmployeeById
  );
  app.post(
    '/api/employees',
    validateRequest({ body: createEmployeeBodySchema }),
    empCtrl.createEmployee
  );

  // Attendance
  app.get(
    '/api/attendance',
    validateRequest({ query: getAttendanceQuerySchema }),
    attCtrl.getAttendance
  );

  // Dashboard
  app.get(
    '/api/dashboard/summary',
    validateRequest({ query: getDashboardSummaryQuerySchema }),
    dashCtrl.getSummary
  );
  app.get(
    '/api/dashboard/attendance',
    validateRequest({ query: getDashboardAttendanceQuerySchema }),
    dashCtrl.getAttendance
  );
  app.get(
    '/api/dashboard/distribution',
    validateRequest({ query: getDashboardDistributionQuerySchema }),
    dashCtrl.getDistribution
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
