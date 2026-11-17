import Database from 'better-sqlite3';
import express, { type Express } from 'express';
import type { RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from '../../src/database/schema';
import { seedDatabase } from '../../src/database/seed';
import { DepartmentRepository } from '../../src/repositories/department.repository';
import { EmployeeRepository } from '../../src/repositories/employee.repository';
import { AttendanceRepository } from '../../src/repositories/attendance.repository';
import { DashboardRepository } from '../../src/repositories/dashboard.repository';
import { AuthRepository } from '../../src/repositories/auth.repository';
import { DepartmentService } from '../../src/services/department.service';
import { EmployeeService } from '../../src/services/employee.service';
import { AttendanceService } from '../../src/services/attendance.service';
import { DashboardService } from '../../src/services/dashboard.service';
import { AuthService } from '../../src/services/auth.service';
import { MfaService } from '../../src/services/mfa.service';
import { AuditService } from '../../src/services/audit.service';
import { HealthController } from '../../src/controllers/health.controller';
import { DepartmentController } from '../../src/controllers/department.controller';
import { EmployeeController } from '../../src/controllers/employee.controller';
import { AttendanceController } from '../../src/controllers/attendance.controller';
import { DashboardController } from '../../src/controllers/dashboard.controller';
import { AuthController } from '../../src/controllers/auth.controller';
import { validateRequest } from '../../src/middleware/validateRequest';
import {
  authenticate,
  requireAnyPermission,
  requirePermission,
  requireRole,
} from '../../src/middleware/auth.middleware';
import type { SafeUser } from '../../src/types/auth.types';
import { ROLE_PERMISSIONS } from '../../src/types/auth.types';
import { notFoundHandler } from '../../src/middleware/notFoundHandler';
import { errorHandler } from '../../src/middleware/errorHandler';
import {
  createRateLimiters,
} from '../../src/middleware/rateLimiter';
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
import {
  loginBodySchema,
  mfaLoginBodySchema,
  refreshTokenBodySchema,
  changePasswordBodySchema,
  mfaConfirmBodySchema,
  mfaDisableBodySchema,
  createUserBodySchema,
  updateUserRoleBodySchema,
  updateUserStatusBodySchema,
} from '../../src/schemas/auth.schema';

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
  const rateLimiters = createRateLimiters({ auth: 1000, api: 10000, sensitive: 1000 });

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '32kb' }));
  app.use(express.urlencoded({ extended: false, limit: '32kb', parameterLimit: 100 }));
  app.use('/api', rateLimiters.api);

  app.locals.db = db;

  // Instantiate repos and services bound to test db
  const deptRepo = new DepartmentRepository(db);
  const empRepo = new EmployeeRepository(db);
  const attRepo = new AttendanceRepository(db);
  const dashRepo = new DashboardRepository(db);
  const authRepo = new AuthRepository(db);

  const deptService = new DepartmentService(deptRepo);
  const empService = new EmployeeService(empRepo);
  const attService = new AttendanceService(attRepo);
  const dashService = new DashboardService(dashRepo);
  const mfaService = new MfaService();
  const auditService = new AuditService(authRepo);
  const authService = new AuthService(authRepo, mfaService, auditService);

  const healthCtrl = new HealthController();
  const deptCtrl = new DepartmentController(deptService);
  const empCtrl = new EmployeeController(empService);
  const attCtrl = new AttendanceController(attService);
  const dashCtrl = new DashboardController(dashService);
  const authCtrl = new AuthController(authService, auditService);
  const testAdmin: SafeUser = {
    id: 1,
    username: 'test-admin',
    email: 'test-admin@workforce.test',
    role: 'admin',
    employee_id: null,
    is_active: true,
    mfa_enabled: false,
    last_login_at: null,
    created_at: new Date(0).toISOString(),
    permissions: ROLE_PERMISSIONS.admin,
    employee_details: null,
  };
  const dataActor: RequestHandler = (req, res, next) => {
    if (req.headers.authorization) {
      void authenticate(req, res, next);
      return;
    }
    req.user = testAdmin;
    next();
  };

  // Health
  app.get('/api/health', healthCtrl.getHealth);

  // Auth Routes
  app.post('/api/auth/login', rateLimiters.login, validateRequest({ body: loginBodySchema }), authCtrl.login);
  app.post('/api/auth/login/mfa', rateLimiters.mfaLogin, validateRequest({ body: mfaLoginBodySchema }), authCtrl.verifyMfa);
  app.post('/api/auth/refresh', rateLimiters.sensitive, validateRequest({ body: refreshTokenBodySchema }), authCtrl.refresh);
  app.post('/api/auth/logout', authenticate, rateLimiters.sensitive, authCtrl.logout);
  app.get('/api/auth/me', authenticate, authCtrl.getMe);
  app.put('/api/auth/password', authenticate, rateLimiters.sensitive, validateRequest({ body: changePasswordBodySchema }), authCtrl.changePassword);
  app.post('/api/auth/mfa/setup', authenticate, rateLimiters.sensitive, authCtrl.setupMfa);
  app.post('/api/auth/mfa/verify', authenticate, rateLimiters.sensitive, validateRequest({ body: mfaConfirmBodySchema }), authCtrl.confirmMfa);
  app.post('/api/auth/mfa/disable', authenticate, rateLimiters.sensitive, validateRequest({ body: mfaDisableBodySchema }), authCtrl.disableMfa);
  app.get('/api/auth/users', authenticate, requireRole('admin'), authCtrl.getUsers);
  app.post('/api/auth/users', authenticate, requireRole('admin'), rateLimiters.sensitive, validateRequest({ body: createUserBodySchema }), authCtrl.createUser);
  app.put('/api/auth/users/:id/role', authenticate, requireRole('admin'), rateLimiters.sensitive, validateRequest({ body: updateUserRoleBodySchema }), authCtrl.updateUserRole);
  app.put('/api/auth/users/:id/status', authenticate, requireRole('admin'), rateLimiters.sensitive, validateRequest({ body: updateUserStatusBodySchema }), authCtrl.updateUserStatus);
  app.get('/api/auth/audit-logs', authenticate, requireRole('admin'), authCtrl.getAuditLogs);
  app.get('/api/auth/sessions', authenticate, authCtrl.getSessions);
  app.delete('/api/auth/sessions/:id', authenticate, rateLimiters.sensitive, authCtrl.revokeSession);

  // Departments
  app.get('/api/departments', dataActor, requirePermission('departments:read'), deptCtrl.getDepartments);

  // Employees
  app.get(
    '/api/employees',
    dataActor,
    requireAnyPermission('employees:read_all', 'employees:read_dept', 'employees:read_own'),
    validateRequest({ query: getEmployeesQuerySchema }),
    empCtrl.getEmployees
  );
  app.get('/api/employees/locations', dataActor, requirePermission('departments:read'), empCtrl.getLocations);
  app.get('/api/employees/export', dataActor, requirePermission('export:data'), empCtrl.exportEmployees);
  app.get(
    '/api/employees/:id',
    dataActor,
    requireAnyPermission('employees:read_all', 'employees:read_dept', 'employees:read_own'),
    validateRequest({ params: getEmployeeByIdParamsSchema }),
    empCtrl.getEmployeeById
  );
  app.post(
    '/api/employees',
    dataActor,
    requirePermission('employees:create'),
    validateRequest({ body: createEmployeeBodySchema }),
    empCtrl.createEmployee
  );
  app.delete(
    '/api/employees/:id',
    authenticate,
    requireRole('admin'),
    validateRequest({ params: getEmployeeByIdParamsSchema }),
    empCtrl.deleteEmployee
  );

  // Attendance
  app.get(
    '/api/attendance',
    dataActor,
    requireAnyPermission('attendance:read_all', 'attendance:read_dept', 'attendance:read_own'),
    validateRequest({ query: getAttendanceQuerySchema }),
    attCtrl.getAttendance
  );
  app.post(
    '/api/attendance/clock-in',
    dataActor,
    requireAnyPermission('attendance:mark_own', 'attendance:manage'),
    attCtrl.clockIn
  );
  app.post(
    '/api/attendance/clock-out',
    dataActor,
    requireAnyPermission('attendance:mark_own', 'attendance:manage'),
    attCtrl.clockOut
  );

  // Dashboard
  app.get(
    '/api/dashboard/summary',
    dataActor,
    requirePermission('dashboard:view'),
    validateRequest({ query: getDashboardSummaryQuerySchema }),
    dashCtrl.getSummary
  );
  app.get(
    '/api/dashboard/attendance',
    dataActor,
    requirePermission('dashboard:view'),
    validateRequest({ query: getDashboardAttendanceQuerySchema }),
    dashCtrl.getAttendance
  );
  app.get(
    '/api/dashboard/distribution',
    dataActor,
    requirePermission('dashboard:view'),
    validateRequest({ query: getDashboardDistributionQuerySchema }),
    dashCtrl.getDistribution
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
