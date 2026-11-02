import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { getResolvedDbPath } from '../config/env';
import { initializeDatabase } from './schema';

let dbInstance: Database.Database | null = null;
let currentDbPath: string | null = null;

export const createDatabaseConnection = (customPath?: string): Database.Database => {
  const resolvedPath = getResolvedDbPath(customPath);

  // If file-based database, ensure directory exists
  if (resolvedPath !== ':memory:' && !resolvedPath.startsWith('file:')) {
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(resolvedPath);

  // Enforce foreign keys on every connection
  db.pragma('foreign_keys = ON');

  // Use WAL mode for file-based DBs (improves concurrency)
  if (resolvedPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }

  // Initialize schema (tables & indexes)
  initializeDatabase(db);

  return db;
};

export const getDb = (customPath?: string): Database.Database => {
  const targetPath = getResolvedDbPath(customPath);

  if (!dbInstance || currentDbPath !== targetPath) {
    if (dbInstance) {
      try {
        dbInstance.close();
      } catch {
        // Ignore close errors
      }
    }
    dbInstance = createDatabaseConnection(customPath);
    currentDbPath = targetPath;
  }

  return dbInstance;
};

export const closeDb = (): void => {
  if (dbInstance) {
    try {
      dbInstance.close();
    } finally {
      dbInstance = null;
      currentDbPath = null;
    }
  }
};
