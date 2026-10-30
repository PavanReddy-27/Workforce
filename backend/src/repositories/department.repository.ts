import type Database from 'better-sqlite3';
import { getDb } from '../database/connection';
import type { Department } from '../types';

export class DepartmentRepository {
  private readonly db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDb();
  }

  public findAll(): Department[] {
    const stmt = this.db.prepare(`
      SELECT id, name, description, created_at, updated_at
      FROM departments
      ORDER BY name ASC
    `);
    return stmt.all() as Department[];
  }

  public findById(id: number): Department | undefined {
    const stmt = this.db.prepare(`
      SELECT id, name, description, created_at, updated_at
      FROM departments
      WHERE id = ?
    `);
    return stmt.get(id) as Department | undefined;
  }

  public findByName(name: string): Department | undefined {
    const stmt = this.db.prepare(`
      SELECT id, name, description, created_at, updated_at
      FROM departments
      WHERE LOWER(name) = LOWER(?)
    `);
    return stmt.get(name) as Department | undefined;
  }

  public count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as c FROM departments');
    const result = stmt.get() as { c: number };
    return result.c;
  }
}
