import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getDb } from "../db";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const router = new Hono();

const WORKSPACES_DIR = () =>
  path.resolve(process.env.WORKSPACES_DIR || path.join(process.cwd(), "workspaces"));

// ─── Encryption helpers ───────────────────────────────────────────────────────
function getEncKey(): string {
  const key = process.env.SECRETS_ENCRYPTION_KEY || "default-key-change-in-production";
  return key.padEnd(32, "0").slice(0, 32);
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(getEncKey()), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(enc: string): string {
  const [ivHex, encHex] = enc.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(getEncKey()), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// ─── POST /supabase/connect ───────────────────────────────────────────────────
const connectSchema = z.object({
  projectId: z.string(),
  projectUrl: z.string().url(),
  anonKey: z.string().min(10),
  serviceRoleKey: z.string().optional(),
  mode: z.enum(["cloud", "local", "selfhost"]).default("cloud"),
});

router.post("/connect", zValidator("json", connectSchema), async (c) => {
  const { projectId, projectUrl, anonKey, serviceRoleKey, mode } = c.req.valid("json");
  const db = getDb();

  // Validate connection
  try {
    const res = await fetch(`${projectUrl}/rest/v1/`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    if (!res.ok && res.status !== 200 && res.status !== 404) {
      return c.json({ error: `Connection test failed: ${res.status}` }, 400);
    }
  } catch (e) {
    return c.json({ error: `Cannot reach Supabase at ${projectUrl}: ${e}` }, 400);
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  // Remove existing link
  db.prepare("DELETE FROM supabase_links WHERE project_id = ?").run(projectId);

  db.prepare(
    `INSERT INTO supabase_links (id, project_id, project_url, anon_key_enc, service_role_key_enc, mode, connected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, projectId, projectUrl,
    encrypt(anonKey),
    serviceRoleKey ? encrypt(serviceRoleKey) : null,
    mode, now
  );

  // Generate integration files
  await generateSupabaseFiles(projectId, projectUrl, anonKey);

  // Update project
  db.prepare("UPDATE projects SET supabase_project_id = ? WHERE id = ?").run(id, projectId);

  return c.json({ ok: true, id });
});

// ─── POST /supabase/test ──────────────────────────────────────────────────────
router.post("/test", async (c) => {
  const { projectUrl, anonKey } = await c.req.json();
  try {
    const res = await fetch(`${projectUrl}/rest/v1/`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    const tables = await listTables(projectUrl, anonKey);
    return c.json({ ok: true, status: res.status, tables });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

// ─── POST /supabase/disconnect ────────────────────────────────────────────────
router.post("/disconnect", async (c) => {
  const { projectId } = await c.req.json();
  const db = getDb();
  db.prepare("DELETE FROM supabase_links WHERE project_id = ?").run(projectId);
  db.prepare("UPDATE projects SET supabase_project_id = NULL WHERE id = ?").run(projectId);
  return c.json({ ok: true });
});

// ─── GET /supabase/:projectId ─────────────────────────────────────────────────
router.get("/:projectId", (c) => {
  const db = getDb();
  const link = db
    .prepare("SELECT id, project_url, mode, connected_at FROM supabase_links WHERE project_id = ?")
    .get(c.req.param("projectId")) as any;

  if (!link) return c.json({ connected: false });

  return c.json({ connected: true, ...link });
});

// ─── GET /supabase/:projectId/tables ─────────────────────────────────────────
router.get("/:projectId/tables", async (c) => {
  const db = getDb();
  const link = db
    .prepare("SELECT project_url, anon_key_enc FROM supabase_links WHERE project_id = ?")
    .get(c.req.param("projectId")) as any;

  if (!link) return c.json({ error: "Not connected" }, 400);

  try {
    const anonKey = decrypt(link.anon_key_enc);
    const tables = await listTables(link.project_url, anonKey);
    return c.json({ tables });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ─── GET /supabase/:projectId/query ──────────────────────────────────────────
router.post("/:projectId/query", async (c) => {
  const db = getDb();
  const link = db
    .prepare("SELECT project_url, anon_key_enc, service_role_key_enc FROM supabase_links WHERE project_id = ?")
    .get(c.req.param("projectId")) as any;

  if (!link) return c.json({ error: "Not connected" }, 400);

  const { sql, table, limit = 100 } = await c.req.json();

  try {
    const key = link.service_role_key_enc
      ? decrypt(link.service_role_key_enc)
      : decrypt(link.anon_key_enc);

    if (sql) {
      // Execute raw SQL via PostgREST RPC or direct
      const res = await fetch(`${link.project_url}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      });
      const data = await res.json();
      return c.json({ data });
    } else if (table) {
      const res = await fetch(
        `${link.project_url}/rest/v1/${table}?limit=${limit}`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        }
      );
      const data = await res.json();
      return c.json({ data });
    }

    return c.json({ error: "Provide sql or table" }, 400);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ─── POST /supabase/:projectId/regenerate-types ───────────────────────────────
router.post("/:projectId/regenerate-types", async (c) => {
  const projectId = c.req.param("projectId");
  const db = getDb();
  const link = db
    .prepare("SELECT project_url, service_role_key_enc FROM supabase_links WHERE project_id = ?")
    .get(projectId) as any;

  if (!link) return c.json({ error: "Not connected" }, 400);

  const projectPath = path.join(WORKSPACES_DIR(), projectId);
  await generateSupabaseFiles(projectId, link.project_url, null, true);

  return c.json({ ok: true });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function listTables(projectUrl: string, anonKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${projectUrl}/rest/v1/?select=*`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
    );
    if (!res.ok) return [];
    const data = await res.json() as any;
    if (data && data.paths) {
      return Object.keys(data.paths)
        .filter((p) => p.startsWith("/") && !p.includes("{"))
        .map((p) => p.slice(1));
    }
    return [];
  } catch {
    return [];
  }
}

async function generateSupabaseFiles(
  projectId: string,
  projectUrl: string,
  anonKey: string | null,
  typesOnly = false
): Promise<void> {
  const projectPath = path.join(WORKSPACES_DIR(), projectId);
  if (!fs.existsSync(projectPath)) return;

  const intDir = path.join(projectPath, "src/integrations/supabase");
  const hooksDir = path.join(intDir, "hooks");
  fs.mkdirSync(hooksDir, { recursive: true });

  if (!typesOnly && anonKey) {
    fs.writeFileSync(
      path.join(intDir, "client.ts"),
      `import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "${projectUrl}";
const SUPABASE_ANON_KEY = "${anonKey}";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
`
    );

    fs.writeFileSync(
      path.join(hooksDir, "useQuery.ts"),
      `import { useEffect, useState } from "react";
import { supabase } from "../client";

export function useSupabaseQuery<T>(
  table: string,
  options?: { filter?: Record<string, unknown>; limit?: number; order?: string }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let query = supabase.from(table).select("*");
      if (options?.limit) query = query.limit(options.limit);
      if (options?.order) query = query.order(options.order);
      const { data: result, error: err } = await query;
      if (err) setError(err.message);
      else setData(result as T[]);
      setLoading(false);
    }
    fetchData();
  }, [table]);

  return { data, loading, error };
}
`
    );

    fs.writeFileSync(
      path.join(hooksDir, "useRealtime.ts"),
      `import { useEffect, useState } from "react";
import { supabase } from "../client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useRealtime<T>(table: string, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData);

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel(\`public:\${table}\`)
      .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        if (payload.eventType === "INSERT") {
          setData((prev) => [...prev, payload.new as T]);
        } else if (payload.eventType === "UPDATE") {
          setData((prev) =>
            prev.map((row: any) =>
              row.id === (payload.new as any).id ? payload.new as T : row
            )
          );
        } else if (payload.eventType === "DELETE") {
          setData((prev) => prev.filter((row: any) => row.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [table]);

  return data;
}
`
    );
  }

  // Always write a placeholder types file
  if (!fs.existsSync(path.join(intDir, "types.ts"))) {
    fs.writeFileSync(
      path.join(intDir, "types.ts"),
      `// Auto-generated Supabase types
// Run "supabase gen types typescript --project-id <your-project-id>" to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}
`
    );
  }
}

export const supabaseRouter = router;
