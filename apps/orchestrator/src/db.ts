import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'love.db');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

export function initDb() {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      git_sha TEXT,
      supabase_url TEXT,
      supabase_key TEXT,
      github_repo TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_turns (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT,
      tokens_in INT DEFAULT 0,
      tokens_out INT DEFAULT 0,
      cost_usd REAL DEFAULT 0,
      git_sha TEXT,
      created_at TEXT NOT NULL,
      attachments TEXT,
      turn_index INT DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS build_runs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      duration_ms INT DEFAULT 0,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deploy_history (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      target TEXT NOT NULL,
      status TEXT NOT NULL,
      url TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_chat_turns_project ON chat_turns(project_id, turn_index);
    CREATE INDEX IF NOT EXISTS idx_build_runs_project ON build_runs(project_id);
    CREATE INDEX IF NOT EXISTS idx_deploy_history_project ON deploy_history(project_id);
  `);

  console.log('✅ Database initialized at', dbPath);
}

export default db;
