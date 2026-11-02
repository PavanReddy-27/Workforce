import type Database from 'better-sqlite3';
import { getDb } from './connection';

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
} => {
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

  // 2. Seed Employees (idempotent)
  const insertEmp = db.prepare(`
    INSERT INTO employees (
      employee_code, first_name, last_name, email, department_id,
      location, job_title, employment_status, hire_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(employee_code) DO UPDATE SET
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      department_id = excluded.department_id,
      location = excluded.location,
      job_title = excluded.job_title,
      employment_status = excluded.employment_status,
      hire_date = excluded.hire_date
  `);

  const seedEmpsTx = db.transaction(() => {
    SAMPLE_EMPLOYEE_TEMPLATES.forEach((tmpl, idx) => {
      const code = `EMP-${String(idx + 1).padStart(3, '0')}`;
      const email = `${tmpl.first.toLowerCase()}.${tmpl.last.toLowerCase().replace(/[^a-z]/g, '')}@stackly.internal`;
      const deptId = deptMap.get(tmpl.dept) || depts[0].id;
      insertEmp.run(
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
    });
  });
  seedEmpsTx();

  // Retrieve employees: id, employment_status
  const employees = db.prepare('SELECT id, employee_code, employment_status FROM employees').all() as {
    id: number;
    employee_code: string;
    employment_status: string;
  }[];

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

  const counts = {
    departmentsCount: (db.prepare('SELECT COUNT(*) as c FROM departments').get() as { c: number }).c,
    employeesCount: (db.prepare('SELECT COUNT(*) as c FROM employees').get() as { c: number }).c,
    attendanceCount: (db.prepare('SELECT COUNT(*) as c FROM attendance').get() as { c: number }).c,
  };

  log(`Database seeded successfully!`);
  log(`- Departments: ${counts.departmentsCount}`);
  log(`- Employees: ${counts.employeesCount}`);
  log(`- Attendance records: ${counts.attendanceCount}`);

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
