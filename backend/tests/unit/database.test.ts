import { describe, it, beforeEach, afterEach } from 'node:test';
import { expect } from '../helpers/expect';
import type Database from 'better-sqlite3';
import { createTestDatabase } from '../helpers/testDb';

describe('Database Schema & Constraints Unit Tests', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase(false);
  });

  afterEach(() => {
    db.close();
  });

  it('should initialize tables and indexes in an empty database', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];

    const tableNames = tables.map((t) => t.name).sort();
    expect(tableNames).toEqual(['attendance', 'departments', 'employees']);

    const deptCount = (db.prepare('SELECT COUNT(*) as c FROM departments').get() as { c: number }).c;
    const empCount = (db.prepare('SELECT COUNT(*) as c FROM employees').get() as { c: number }).c;
    const attCount = (db.prepare('SELECT COUNT(*) as c FROM attendance').get() as { c: number }).c;

    expect(deptCount).toBe(0);
    expect(empCount).toBe(0);
    expect(attCount).toBe(0);
  });

  it('should enforce foreign key constraints on employee department_id', () => {
    expect(() => {
      db.prepare(`
        INSERT INTO employees (
          employee_code, first_name, last_name, email, department_id, location, job_title, employment_status, hire_date
        ) VALUES ('EMP-999', 'Ghost', 'User', 'ghost@stackly.internal', 9999, 'Remote Global', 'Tester', 'Active', '2024-01-01')
      `).run();
    }).toThrow(/FOREIGN KEY constraint failed/);
  });

  it('should enforce unique department name constraint', () => {
    db.prepare("INSERT INTO departments (name, description) VALUES ('Engineering', 'Dev')").run();

    expect(() => {
      db.prepare("INSERT INTO departments (name, description) VALUES ('Engineering', 'Duplicate')").run();
    }).toThrow(/UNIQUE constraint failed/);
  });

  it('should enforce unique employee code and email constraints', () => {
    db.prepare("INSERT INTO departments (name) VALUES ('Product')").run();
    const deptId = (db.prepare("SELECT id FROM departments WHERE name = 'Product'").get() as { id: number }).id;

    db.prepare(`
      INSERT INTO employees (
        employee_code, first_name, last_name, email, department_id, location, job_title, employment_status, hire_date
      ) VALUES ('EMP-100', 'Jane', 'Doe', 'jane.doe@stackly.internal', ?, 'San Francisco HQ', 'Designer', 'Active', '2024-01-01')
    `).run(deptId);

    // Duplicate employee_code
    expect(() => {
      db.prepare(`
        INSERT INTO employees (
          employee_code, first_name, last_name, email, department_id, location, job_title, employment_status, hire_date
        ) VALUES ('EMP-100', 'Other', 'Person', 'other@stackly.internal', ?, 'London Tech Hub', 'Designer', 'Active', '2024-01-01')
      `).run(deptId);
    }).toThrow(/UNIQUE constraint failed: employees.employee_code/);

    // Duplicate email
    expect(() => {
      db.prepare(`
        INSERT INTO employees (
          employee_code, first_name, last_name, email, department_id, location, job_title, employment_status, hire_date
        ) VALUES ('EMP-101', 'Other', 'Person', 'jane.doe@stackly.internal', ?, 'London Tech Hub', 'Designer', 'Active', '2024-01-01')
      `).run(deptId);
    }).toThrow(/UNIQUE constraint failed: employees.email/);
  });

  it('should prevent duplicate attendance records for the same employee and date', () => {
    db.prepare("INSERT INTO departments (name) VALUES ('Sales')").run();
    const deptId = (db.prepare("SELECT id FROM departments WHERE name = 'Sales'").get() as { id: number }).id;

    db.prepare(`
      INSERT INTO employees (
        employee_code, first_name, last_name, email, department_id, location, job_title, employment_status, hire_date
      ) VALUES ('EMP-200', 'Bob', 'Ross', 'bob.ross@stackly.internal', ?, 'London Tech Hub', 'Sales Lead', 'Active', '2023-01-01')
    `).run(deptId);

    const empId = (db.prepare("SELECT id FROM employees WHERE employee_code = 'EMP-200'").get() as { id: number }).id;

    db.prepare(`
      INSERT INTO attendance (employee_id, attendance_date, status)
      VALUES (?, '2026-10-30', 'Present')
    `).run(empId);

    expect(() => {
      db.prepare(`
        INSERT INTO attendance (employee_id, attendance_date, status)
        VALUES (?, '2026-10-30', 'Absent')
      `).run(empId);
    }).toThrow(/UNIQUE constraint failed: attendance.employee_id, attendance.attendance_date/);
  });

  it('should enforce CHECK constraints for valid employment and attendance status values', () => {
    db.prepare("INSERT INTO departments (name) VALUES ('HR')").run();
    const deptId = (db.prepare("SELECT id FROM departments WHERE name = 'HR'").get() as { id: number }).id;

    // Invalid employment_status
    expect(() => {
      db.prepare(`
        INSERT INTO employees (
          employee_code, first_name, last_name, email, department_id, location, job_title, employment_status, hire_date
        ) VALUES ('EMP-300', 'Bad', 'Status', 'bad.status@stackly.internal', ?, 'Remote Global', 'Dev', 'InvalidStatus', '2024-01-01')
      `).run(deptId);
    }).toThrow(/CHECK constraint failed/);

    db.prepare(`
      INSERT INTO employees (
        employee_code, first_name, last_name, email, department_id, location, job_title, employment_status, hire_date
      ) VALUES ('EMP-301', 'Good', 'Status', 'good.status@stackly.internal', ?, 'Remote Global', 'Dev', 'Active', '2024-01-01')
    `).run(deptId);

    const empId = (db.prepare("SELECT id FROM employees WHERE employee_code = 'EMP-301'").get() as { id: number }).id;

    // Invalid attendance status
    expect(() => {
      db.prepare(`
        INSERT INTO attendance (employee_id, attendance_date, status)
        VALUES (?, '2026-10-30', 'UnknownStatus')
      `).run(empId);
    }).toThrow(/CHECK constraint failed/);
  });
});
