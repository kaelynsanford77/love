import { Router } from 'express';
import { z } from 'zod';
import { createHash } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getDb } from '../db.js';

const router = Router();

const WORKSPACES_DIR = process.env.WORKSPACES_DIR ?? join(process.cwd(), '..', '..', 'workspaces');

const connectSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('supabase'),
    projectId: z.string().optional(),
    url: z.string().url(),
    anonKey: z.string().min(1),
    serviceKey: z.string().optional(),
  }),
  z.object({
    type: z.literal('postgres'),
    projectId: z.string().optional(),
    url: z.string().min(1),
  }),
]);

const typesSchema = z.object({
  projectId: z.string().optional(),
});

function encryptKey(key: string): string {
  // Simple base64 obfuscation — in production use proper encryption
  return Buffer.from(key).toString('base64');
}

function generateSupabaseClient(supabaseUrl: string, anonKey: string): string {
  return `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${supabaseUrl}'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? '${anonKey.slice(0, 20)}...'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Usage examples:
// const { data, error } = await supabase.from('table').select('*')
// const { data: { user } } = await supabase.auth.getUser()
// supabase.channel('changes').on('postgres_changes', ...).subscribe()
`;
}

function generatePostgresClient(connectionUrl: string): string {
  const safe = connectionUrl.replace(/:[^:@]+@/, ':***@');
  return `import { Pool } from 'pg'

// Store connection URL in .env as DATABASE_URL
// DATABASE_URL="${safe}"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

export default pool
`;
}

// POST /supabase/connect
router.post('/connect', async (req, res) => {
  try {
    const parsed = connectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const data = parsed.data;
    let clientCode: string;
    let testResult = { ok: true, tables: [] as string[] };

    if (data.type === 'supabase') {
      clientCode = generateSupabaseClient(data.url, data.anonKey);

      // Try to connect and list tables
      try {
        const resp = await fetch(`${data.url}/rest/v1/?apikey=${data.anonKey}`, {
          headers: {
            Authorization: `Bearer ${data.anonKey}`,
            apikey: data.anonKey,
          },
          signal: AbortSignal.timeout(5000),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json() as { paths?: Record<string, unknown> };
        if (json.paths) {
          testResult.tables = Object.keys(json.paths)
            .filter((p) => p.startsWith('/'))
            .map((p) => p.slice(1))
            .filter((t) => !t.startsWith('rpc/'))
            .slice(0, 20);
        }
      } catch {
        // Connection might fail in dev, still return the client code
      }

      // Store encrypted key if project provided
      if (data.projectId) {
        try {
          const db = getDb();
          db.prepare(`
            UPDATE projects SET
              supabase_url = ?,
              supabase_anon_key_enc = ?,
              updated_at = ?
            WHERE id = ?
          `).run(data.url, encryptKey(data.anonKey), new Date().toISOString(), data.projectId);
        } catch {
          // DB might not have the projects table yet
        }
      }
    } else {
      clientCode = generatePostgresClient(data.url);
    }

    // Write client file to project if path is known
    if (data.projectId) {
      try {
        const db = getDb();
        const project = db.prepare('SELECT path FROM projects WHERE id = ?').get(data.projectId) as { path?: string };
        if (project?.path) {
          const libDir = join(project.path, 'src', 'lib');
          mkdirSync(libDir, { recursive: true });
          const filename = data.type === 'supabase' ? 'supabase.ts' : 'db.ts';
          writeFileSync(join(libDir, filename), clientCode, 'utf-8');
        }
      } catch {
        // Project directory might not exist yet
      }
    }

    res.json({ ok: true, clientCode, tables: testResult.tables });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /supabase/types — generate TypeScript types from schema
router.post('/types', async (req, res) => {
  try {
    const parsed = typesSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const { projectId } = parsed.data;

    if (!projectId) {
      return res.json({ ok: true, message: 'No project ID provided' });
    }

    let supabaseUrl: string | null = null;
    let anonKeyEnc: string | null = null;

    try {
      const db = getDb();
      const project = db.prepare('SELECT supabase_url, supabase_anon_key_enc, path FROM projects WHERE id = ?').get(projectId) as {
        supabase_url?: string;
        supabase_anon_key_enc?: string;
        path?: string;
      };
      supabaseUrl = project?.supabase_url ?? null;
      anonKeyEnc = project?.supabase_anon_key_enc ?? null;

      if (supabaseUrl && anonKeyEnc && project?.path) {
        // Generate placeholder types file
        const typesContent = generatePlaceholderTypes();
        const typesDir = join(project.path, 'src', 'lib');
        mkdirSync(typesDir, { recursive: true });
        writeFileSync(join(typesDir, 'database.types.ts'), typesContent, 'utf-8');
        return res.json({ ok: true, message: 'Types file written to src/lib/database.types.ts' });
      }
    } catch {
      // DB not available
    }

    res.json({ ok: true, message: 'Connect a database first to generate types' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

function generatePlaceholderTypes(): string {
  return `// Auto-generated Supabase type definitions
// Run 'npx supabase gen types typescript --project-id <id>' to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Your tables will appear here after running type generation
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
`;
}

export default router;
