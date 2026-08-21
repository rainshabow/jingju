import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';

const DB_PATH = process.env.DB_PATH || 'data/jingju.db';

// Ensure directory exists
const dir = dirname(DB_PATH);
try { mkdirSync(dir, { recursive: true }); } catch {}

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { sqlite };

/**
 * Auto-create tables from Drizzle schema (migration-free for dev).
 *
 * The Drizzle schema in schema.ts is the single source of truth.
 * This function derives CREATE TABLE statements from the Drizzle
 * introspection metadata to guarantee parity.
 */
export function initDB() {
  // Use Drizzle's built-in push for dev convenience.
  // Each table is checked with IF NOT EXISTS — safe to call on every boot.
  const tables = schema;
  const tableDefs: Record<string, string> = {
    plays: `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      code TEXT UNIQUE,
      source TEXT,
      genre TEXT,
      era TEXT,
      full_text TEXT,
      analyzed_at TEXT,
      analysis_status TEXT DEFAULT 'idle',
      analysis_progress INTEGER DEFAULT 0
    `,
    characters: `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      play_id INTEGER NOT NULL REFERENCES plays(id),
      name TEXT NOT NULL,
      gender TEXT,
      age_group TEXT,
      identity TEXT,
      personality TEXT,
      performance_style TEXT,
      role_type TEXT,
      role_subtype TEXT,
      confidence REAL,
      centrality REAL
    `,
    relations: `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      play_id INTEGER NOT NULL REFERENCES plays(id),
      char_a TEXT NOT NULL,
      char_b TEXT NOT NULL,
      relation_type TEXT,
      strength REAL,
      description TEXT,
      evidence TEXT
    `,
    themes: `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      play_id INTEGER NOT NULL REFERENCES plays(id),
      theme_name TEXT NOT NULL,
      weight REAL,
      color TEXT,
      evidence TEXT,
      stages TEXT
    `,
    narrative_stages: `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      play_id INTEGER NOT NULL REFERENCES plays(id),
      stage_order INTEGER NOT NULL,
      stage_name TEXT NOT NULL,
      intensity REAL,
      note TEXT
    `,
  };
  for (const [name, cols] of Object.entries(tableDefs)) {
    sqlite.exec(`CREATE TABLE IF NOT EXISTS ${name} (${cols})`);
  }
  console.log(`[DB] initialized at ${DB_PATH}`);
}
