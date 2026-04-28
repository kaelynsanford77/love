import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database;

export function getDb(): Database.Database {
  return db;
}

export function initDb(): void {
  const dbDir = process.env.DB_DIR || path.join(process.cwd(), "data");
  fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, "lovable.db");

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      framework TEXT DEFAULT 'vite-react',
      port INTEGER,
      status TEXT DEFAULT 'stopped',
      pid INTEGER,
      github_remote TEXT,
      supabase_project_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_activity INTEGER
    );

    CREATE TABLE IF NOT EXISTS supabase_links (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      project_url TEXT NOT NULL,
      anon_key_enc TEXT NOT NULL,
      service_role_key_enc TEXT,
      mode TEXT DEFAULT 'cloud',
      connected_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS secrets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value_enc TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(project_id, key)
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT,
      tier TEXT,
      tokens_in INTEGER DEFAULT 0,
      tokens_out INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  console.log(`📦 Database initialized at ${dbPath}`);
}
