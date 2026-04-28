import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getDb } from '../db.js';

const router = Router();

// Initialize projects table
function initProjectsTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      port INTEGER,
      framework TEXT,
      description TEXT,
      template TEXT,
      github_repo TEXT,
      supabase_url TEXT,
      supabase_anon_key_enc TEXT,
      settings_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  template: z.string().optional().default('blank'),
  description: z.string().optional().default(''),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  framework: z.string().optional(),
  description: z.string().optional(),
  supabaseUrl: z.string().optional(),
  supabaseAnonKey: z.string().optional(),
  port: z.number().optional(),
  settings: z.record(z.unknown()).optional(),
});

function allocatePort(): number {
  const db = getDb();
  initProjectsTable();
  const row = db.prepare('SELECT MAX(port) as maxPort FROM projects').get() as { maxPort: number | null };
  const base = 3100;
  return (row?.maxPort ?? base - 1) + 1;
}

// GET /projects — list all projects
router.get('/', (_req, res) => {
  try {
    initProjectsTable();
    const db = getDb();
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
    res.json(projects.map(dbRowToProject));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /projects — create new project
router.post('/', (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    initProjectsTable();
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    const port = allocatePort();
    const { name, template, description } = parsed.data;
    const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const projectPath = `workspaces/${safeName}-${id.slice(0, 8)}`;

    // Detect framework from template
    const frameworkMap: Record<string, string> = {
      'react-vite': 'react',
      'nextjs': 'next',
      'vue': 'vue',
      'svelte': 'svelte',
      'landing': 'react',
      'dashboard': 'react',
      'api': 'express',
      'blank': 'unknown',
    };
    const framework = frameworkMap[template] ?? 'unknown';

    db.prepare(`
      INSERT INTO projects (id, name, path, port, framework, description, template, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, projectPath, port, framework, description ?? '', template, now, now);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Record<string, unknown>;
    res.status(201).json(dbRowToProject(project));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /projects/:id — update project
router.patch('/:id', (req, res) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    initProjectsTable();
    const db = getDb();
    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    const { name, framework, description, supabaseUrl, supabaseAnonKey, port, settings } = parsed.data;
    const now = new Date().toISOString();

    // Encrypt supabase key if provided
    let encKey: string | null = null;
    if (supabaseAnonKey) {
      encKey = Buffer.from(supabaseAnonKey).toString('base64');
    }

    db.prepare(`
      UPDATE projects SET
        name = COALESCE(?, name),
        framework = COALESCE(?, framework),
        description = COALESCE(?, description),
        supabase_url = COALESCE(?, supabase_url),
        supabase_anon_key_enc = COALESCE(?, supabase_anon_key_enc),
        port = COALESCE(?, port),
        settings_json = COALESCE(?, settings_json),
        updated_at = ?
      WHERE id = ?
    `).run(
      name ?? null,
      framework ?? null,
      description ?? null,
      supabaseUrl ?? null,
      encKey,
      port ?? null,
      settings ? JSON.stringify(settings) : null,
      now,
      req.params.id,
    );

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as Record<string, unknown>;
    res.json(dbRowToProject(updated));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /projects/:id
router.delete('/:id', (req, res) => {
  try {
    initProjectsTable();
    const db = getDb();
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

function dbRowToProject(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    port: row.port,
    framework: row.framework,
    description: row.description,
    template: row.template,
    githubRepo: row.github_repo,
    supabaseUrl: row.supabase_url,
    // Never expose encrypted key to client
    createdAt: row.created_at,
    settings: row.settings_json ? JSON.parse(row.settings_json as string) : undefined,
  };
}

export default router;
