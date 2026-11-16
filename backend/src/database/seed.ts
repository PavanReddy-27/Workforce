import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { getDb } from './connection';
import { config } from '../config/env';

export interface SeedOptions {
  db?: Database.Database;
  daysBack?: number;
  quiet?: boolean;
}

export const SEED_DEPARTMENTS = [
  { name: 'Engineering', description: 'Core software engineering, platform architecture, and cloud infrastructure' },
  { name: 'Product & Design', description: 'Product strategy, technical product management, UX/UI design, and user research' },
  { name: 'Sales & Marketing', description: 'Enterprise sales, demand generation, product marketing, and brand growth' },
  { name: 'Customer Success', description: 'Solutions architecture, technical account management, and customer support' },
  { name: 'Human Resources', description: 'People operations, talent acquisition, culture, and organizational development' },
  { name: 'Finance & Legal', description: 'Corporate financial planning, treasury, accounting, and compliance' },
];

export const SEED_LOCATIONS = [
  'San Francisco HQ',
  'London Tech Hub',
  'Singapore Office',
  'Remote Global',
];

export const SAMPLE_EMPLOYEE_TEMPLATES = [
  { first: 'Sarah', last: 'Jenkins', role: 'Staff ML Infrastructure Engineer', dept: 'Engineering', loc: 'San Francisco HQ', status: 'Active', hire: '2022-03-15' },
  { first: 'Marcus', last: 'Chen', role: 'Director of Product', dept: 'Product & Design', loc: 'San Francisco HQ', status: 'Active', hire: '2021-08-01' },
  { first: 'Elena', last: 'Rostova', role: 'Senior Solutions Architect', dept: 'Customer Success', loc: 'Singapore Office', status: 'Active', hire: '2022-11-10' },
  { first: 'David', last: 'Kim', role: 'Lead UX Researcher', dept: 'Product & Design', loc: 'San Francisco HQ', status: 'On Leave', hire: '2023-02-01' },
  { first: 'Amara', last: 'Okafor', role: 'VP of Global Talent', dept: 'Human Resources', loc: 'London Tech Hub', status: 'Active', hire: '2020-05-18' },
  { first: 'Liam', last: 'O’Connor', role: 'Senior DevOps Architect', dept: 'Engineering', loc: 'Remote Global', status: 'Active', hire: '2023-06-15' },
  { first: 'Priya', last: 'Sharma', role: 'Senior Financial Analyst', dept: 'Finance & Legal', loc: 'London Tech Hub', status: 'Active', hire: '2021-09-20' },
  { first: 'Alex', last: 'Rivera', role: 'Growth Marketing Associate', dept: 'Sales & Marketing', loc: 'San Francisco HQ', status: 'Active', hire: '2024-01-10' },
  { first: 'Emily', last: 'Watson', role: 'Principal Security Engineer', dept: 'Engineering', loc: 'London Tech Hub', status: 'Active', hire: '2020-10-12' },
  { first: 'James', last: 'Wilson', role: 'Senior Product Designer', dept: 'Product & Design', loc: 'London Tech Hub', status: 'Active', hire: '2022-04-05' },
  { first: 'Carlos', last: 'Mendez', role: 'Enterprise Account Executive', dept: 'Sales & Marketing', loc: 'San Francisco HQ', status: 'Active', hire: '2021-11-15' },
  { first: 'Aisha', last: 'Patel', role: 'Customer Success Manager', dept: 'Customer Success', loc: 'Singapore Office', status: 'Active', hire: '2023-03-20' },
  { first: 'Michael', last: 'Chang', role: 'Backend Systems Engineer', dept: 'Engineering', loc: 'Remote Global', status: 'Active', hire: '2022-07-01' },
  { first: 'Sophie', last: 'Dubois', role: 'Talent Acquisition Lead', dept: 'Human Resources', loc: 'London Tech Hub', status: 'Active', hire: '2021-02-14' },
  { first: 'Robert', last: 'Taylor', role: 'Corporate Legal Counsel', dept: 'Finance & Legal', loc: 'San Francisco HQ', status: 'Active', hire: '2020-08-25' },
  { first: 'Zainab', last: 'Al-Mansoor', role: 'Frontend Architect', dept: 'Engineering', loc: 'Singapore Office', status: 'Active', hire: '2023-05-11' },
  { first: 'Lucas', last: 'Silva', role: 'Performance Marketing Lead', dept: 'Sales & Marketing', loc: 'Remote Global', status: 'Active', hire: '2022-09-08' },
  { first: 'Jessica', last: 'Miller', role: 'Product Operations Manager', dept: 'Product & Design', loc: 'San Francisco HQ', status: 'Active', hire: '2023-10-02' },
  { first: 'Daniel', last: 'Kowalski', role: 'Site Reliability Engineer', dept: 'Engineering', loc: 'London Tech Hub', status: 'Active', hire: '2021-06-30' },
  { first: 'Hannah', last: 'Abbott', role: 'Billing Operations Specialist', dept: 'Finance & Legal', loc: 'London Tech Hub', status: 'Active', hire: '2024-02-01' },
  { first: 'Kevin', last: 'Nakamura', role: 'Data Platform Engineer', dept: 'Engineering', loc: 'Remote Global', status: 'Active', hire: '2022-01-18' },
  { first: 'Rachel', last: 'Green', role: 'Sales Enablement Specialist', dept: 'Sales & Marketing', loc: 'San Francisco HQ', status: 'Active', hire: '2023-08-14' },
  { first: 'Thomas', last: 'Anderson', role: 'Senior Systems Architect', dept: 'Engineering', loc: 'San Francisco HQ', status: 'Active', hire: '2019-11-04' },
  { first: 'Chloe', last: 'Martin', role: 'HR Business Partner', dept: 'Human Resources', loc: 'San Francisco HQ', status: 'Active', hire: '2022-12-01' },
  { first: 'Vikram', last: 'Malhotra', role: 'Technical Account Manager', dept: 'Customer Success', loc: 'Singapore Office', status: 'Active', hire: '2023-04-18' },
  { first: 'Oliver', last: 'Smith', role: 'Full Stack Engineer', dept: 'Engineering', loc: 'London Tech Hub', status: 'Terminated', hire: '2021-01-10' },
  { first: 'Mia', last: 'Johnson', role: 'Junior Product Manager', dept: 'Product & Design', loc: 'San Francisco HQ', status: 'Active', hire: '2024-03-01' },
  { first: 'Ethan', last: 'Brown', role: 'Cloud Network Engineer', dept: 'Engineering', loc: 'Remote Global', status: 'Active', hire: '2023-07-22' },
  { first: 'Ava', last: 'Williams', role: 'Content Strategy Lead', dept: 'Sales & Marketing', loc: 'London Tech Hub', status: 'Active', hire: '2022-05-30' },
  { first: 'Noah', last: 'Garcia', role: 'Support Operations Engineer', dept: 'Customer Success', loc: 'San Francisco HQ', status: 'Active', hire: '2023-09-12' },
];

export const seedDatabase = (options: SeedOptions = {}): {
  departmentsCount: number;
  employeesCount: number;
  attendanceCount: number;
  usersCount: number;
} => {
  if (config.NODE_ENV === 'production') {
    throw new Error('Demo database seeding is disabled in production.');
  }

  const db = options.db || getDb();
  const daysBack = options.daysBack ?? 30;
  const quiet = options.quiet ?? false;

  const log = (msg: string) => {
    if (!quiet) console.log(msg);
  };

  log('Starting database seeding...');

  // 1. Seed Departments (idempotent)
  const insertDept = db.prepare(`
    INSERT INTO departments (name, description)
    VALUES (?, ?)
    ON CONFLICT(name) DO UPDATE SET description = excluded.description
  `);

  const seedDeptsTx = db.transaction(() => {
    for (const d of SEED_DEPARTMENTS) {
      insertDept.run(d.name, d.description);
    }
  });
  seedDeptsTx();

  // Retrieve department map: name -> id
  const depts = db.prepare('SELECT id, name FROM departments').all() as { id: number; name: string }[];
  const deptMap = new Map<string, number>();
  for (const d of depts) {
    deptMap.set(d.name, d.id);
  }

  // 2. Seed Employees (safe conflict resolution by email or code)
  const findEmpStmt = db.prepare('SELECT id FROM employees WHERE email = ? OR employee_code = ? LIMIT 1');
  const updateEmpStmt = db.prepare(`
    UPDATE employees SET
      first_name = ?, last_name = ?, department_id = ?, location = ?,
      job_title = ?, employment_status = ?, hire_date = ?
    WHERE id = ?
  `);
  const insertEmpStmt = db.prepare(`
    INSERT INTO employees (
      employee_code, first_name, last_name, email, department_id,
      location, job_title, employment_status, hire_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedEmpsTx = db.transaction(() => {
    SAMPLE_EMPLOYEE_TEMPLATES.forEach((tmpl, idx) => {
      const code = `EMP-${String(idx + 1).padStart(3, '0')}`;
      const email = `${tmpl.first.toLowerCase()}.${tmpl.last.toLowerCase().replace(/[^a-z]/g, '')}@stackly.internal`;
      const deptId = deptMap.get(tmpl.dept) || depts[0].id;

      const existing = findEmpStmt.get(email, code) as { id: number } | undefined;
      if (existing) {
        updateEmpStmt.run(
          tmpl.first,
          tmpl.last,
          deptId,
          tmpl.loc,
          tmpl.role,
          tmpl.status,
          tmpl.hire,
          existing.id
        );
      } else {
        insertEmpStmt.run(
          code,
          tmpl.first,
          tmpl.last,
          email,
          deptId,
          tmpl.loc,
          tmpl.role,
          tmpl.status,
          tmpl.hire
        );
      }
    });
  });
  seedEmpsTx();

  // Retrieve employees
  const employees = db.prepare('SELECT id, employee_code, first_name, last_name, employment_status FROM employees').all() as {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    employment_status: string;
  }[];

  const empByFirstLast = new Map<string, number>();
  for (const emp of employees) {
    empByFirstLast.set(`${emp.first_name} ${emp.last_name}`, emp.id);
  }

  // 3. Seed Attendance Records across past daysBack days (idempotent)
  const insertAttendance = db.prepare(`
    INSERT INTO attendance (
      employee_id, attendance_date, status, check_in_time, check_out_time
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(employee_id, attendance_date) DO UPDATE SET
      status = excluded.status,
      check_in_time = excluded.check_in_time,
      check_out_time = excluded.check_out_time
  `);

  const today = new Date();

  const seedAttendanceTx = db.transaction(() => {
    for (let dayOffset = daysBack; dayOffset >= 0; dayOffset--) {
      const dateObj = new Date(today);
      dateObj.setDate(dateObj.getDate() - dayOffset);
      const dateStr = dateObj.toISOString().split('T')[0];

      // Skip Sundays for realistic enterprise attendance patterns
      const dayOfWeek = dateObj.getDay();
      if (dayOfWeek === 0) continue; // Sunday off

      employees.forEach((emp, empIdx) => {
        // Skip terminated employees
        if (emp.employment_status === 'Terminated') return;

        let status: 'Present' | 'Absent' | 'On Leave' = 'Present';
        let checkIn: string | null = `${dateStr}T08:${String(30 + (empIdx % 25)).padStart(2, '0')}:00Z`;
        let checkOut: string | null = `${dateStr}T17:${String(15 + (empIdx % 40)).padStart(2, '0')}:00Z`;

        if (emp.employment_status === 'On Leave') {
          status = 'On Leave';
          checkIn = null;
          checkOut = null;
        } else {
          // Deterministic pattern: occasional absence or leave based on hash
          const hash = (emp.id * 31 + dayOffset * 17) % 100;
          if (hash < 3) {
            status = 'On Leave';
            checkIn = null;
            checkOut = null;
          } else if (hash < 6) {
            status = 'Absent';
            checkIn = null;
            checkOut = null;
          }
        }

        insertAttendance.run(emp.id, dateStr, status, checkIn, checkOut);
      });
    }
  });
  seedAttendanceTx();

  // 4. Seed Default Users with RBAC Roles & Individual Logins for Every Employee (idempotent)
  const findUserStmt = db.prepare('SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1');
  const updateUserStmt = db.prepare(`
    UPDATE users SET
      password_hash = ?, role = ?, employee_id = ?, is_active = 1
    WHERE id = ?
  `);
  const updateUserWithActiveStmt = db.prepare(`
    UPDATE users SET
      password_hash = ?, role = ?, employee_id = ?, is_active = ?
    WHERE id = ?
  `);
  const insertUserStmt = db.prepare(`
    INSERT INTO users (
      username, email, password_hash, role, employee_id, is_active, mfa_enabled, failed_login_attempts
    ) VALUES (?, ?, ?, ?, ?, 1, 0, 0)
  `);
  const insertUserWithActiveStmt = db.prepare(`
    INSERT INTO users (
      username, email, password_hash, role, employee_id, is_active, mfa_enabled, failed_login_attempts
    ) VALUES (?, ?, ?, ?, ?, ?, 0, 0)
  `);

  const userSeeds = [
    {
      username: 'admin',
      email: 'admin@workforce.com',
      password: 'Admin@123456',
      role: 'admin',
      employeeId: null,
    },
    {
      username: 'hr_amara',
      email: 'hr@workforce.com',
      password: 'Hr@123456',
      role: 'hr',
      employeeId: empByFirstLast.get('Amara Okafor') || null,
    },
    {
      username: 'mgr_marcus',
      email: 'manager@workforce.com',
      password: 'Manager@123456',
      role: 'manager',
      employeeId: empByFirstLast.get('Marcus Chen') || null,
    },
    {
      username: 'lead_zainab',
      email: 'lead@workforce.com',
      password: 'Lead@123456',
      role: 'team_lead',
      employeeId: empByFirstLast.get('Zainab Al-Mansoor') || null,
    },
    {
      username: 'emp_sarah',
      email: 'employee@workforce.com',
      password: 'Employee@123456',
      role: 'employee',
      employeeId: empByFirstLast.get('Sarah Jenkins') || null,
    },
  ];

  // Retrieve all seeded employees to create their separate user logins
  const allEmployees = db.prepare(`
    SELECT e.id, e.first_name, e.last_name, e.email, e.job_title, e.employment_status, d.name as dept_name
    FROM employees e
    JOIN departments d ON e.department_id = d.id
    ORDER BY e.id ASC
  `).all() as Array<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    job_title: string;
    employment_status: string;
    dept_name: string;
  }>;

  const employeeUserSeeds = allEmployees.map((emp) => {
    const cleanFirst = emp.first_name.trim();
    const cleanLast = emp.last_name.trim();
    const username = `${cleanFirst.toLowerCase()}_${cleanLast.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    let role: 'admin' | 'hr' | 'manager' | 'team_lead' | 'employee';
    const title = emp.job_title.toLowerCase();
    const dept = emp.dept_name.toLowerCase();

    if (title.includes('principal security engineer') || title.includes('system admin') || (title.includes('infrastructure') && cleanFirst === 'Emily')) {
      role = 'admin';
    } else if (dept.includes('human resources') || title.includes('talent')) {
      role = 'hr';
    } else if (title.includes('director') || title.includes('vp') || title.includes('head') || title.includes('manager')) {
      role = 'manager';
    } else if (title.includes('lead') || title.includes('architect')) {
      role = 'team_lead';
    } else {
      role = 'employee';
    }

    const defaultPass = `${cleanFirst.charAt(0).toUpperCase() + cleanFirst.slice(1).toLowerCase()}@123456`;
    const isActive = emp.employment_status === 'Terminated' ? 0 : 1;

    return {
      username,
      email: emp.email,
      password: defaultPass,
      role,
      employeeId: emp.id,
      isActive,
    };
  });

  const seedUsersTx = db.transaction(() => {
    // 1. System demo role accounts
    for (const u of userSeeds) {
      const passwordHash = bcrypt.hashSync(u.password, 10);
      const existingUser = findUserStmt.get(u.email, u.username) as { id: number } | undefined;
      if (existingUser) {
        updateUserStmt.run(passwordHash, u.role, u.employeeId, existingUser.id);
      } else {
        insertUserStmt.run(u.username, u.email, passwordHash, u.role, u.employeeId);
      }
    }

    // 2. Individual login accounts for every employee
    for (const u of employeeUserSeeds) {
      const passwordHash = bcrypt.hashSync(u.password, 10);
      const existingUser = findUserStmt.get(u.email, u.username) as { id: number } | undefined;
      if (existingUser) {
        updateUserWithActiveStmt.run(passwordHash, u.role, u.employeeId, u.isActive, existingUser.id);
      } else {
        insertUserWithActiveStmt.run(u.username, u.email, passwordHash, u.role, u.employeeId, u.isActive);
      }
    }
  });
  seedUsersTx();

  const counts = {
    departmentsCount: (db.prepare('SELECT COUNT(*) as c FROM departments').get() as { c: number }).c,
    employeesCount: (db.prepare('SELECT COUNT(*) as c FROM employees').get() as { c: number }).c,
    attendanceCount: (db.prepare('SELECT COUNT(*) as c FROM attendance').get() as { c: number }).c,
    usersCount: (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c,
  };

  log(`Database seeded successfully!`);
  log(`- Departments: ${counts.departmentsCount}`);
  log(`- Employees: ${counts.employeesCount}`);
  log(`- Attendance records: ${counts.attendanceCount}`);
  log(`- Users (RBAC): ${counts.usersCount}`);

  return counts;
};

// If executed directly from command line: tsx src/database/seed.ts
if (require.main === module || process.argv[1]?.includes('seed')) {
  try {
    seedDatabase();
    process.exit(0);
  } catch (err) {
    console.error('Database seeding failed:', err);
    process.exit(1);
  }
}
