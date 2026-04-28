import { Hono } from "hono";
import { join } from "path";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const app = new Hono();
const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), "data");
const CONNECTIONS_FILE = join(DATA_DIR, "supabase-connections.json");

function getEncryptionKey(): Buffer {
  const key = process.env.VAULT_ENCRYPTION_KEY ?? "default-key-change-this-in-prod!";
  return createHash("sha256").update(key).digest();
}

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", getEncryptionKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
  const [ivHex, encrypted] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", getEncryptionKey(), iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

interface StoredConnection {
  projectId: string;
  url: string;
  anonKeyEncrypted: string;
  serviceRoleKeyEncrypted?: string;
  connectedAt: string;
}

async function loadConnections(): Promise<StoredConnection[]> {
  if (!existsSync(CONNECTIONS_FILE)) return [];
  return JSON.parse(await readFile(CONNECTIONS_FILE, "utf-8"));
}

async function saveConnections(connections: StoredConnection[]) {
  await writeFile(CONNECTIONS_FILE, JSON.stringify(connections, null, 2));
}

// POST /supabase/connect
app.post("/connect", async (c) => {
  const { projectId, url, anonKey, serviceRoleKey } = await c.req.json<{
    projectId: string;
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  }>();

  if (!url || !anonKey) return c.json({ error: "url and anonKey are required" }, 400);
  if (!url.startsWith("https://")) return c.json({ error: "URL must use HTTPS" }, 400);

  try {
    const resp = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    if (!resp.ok && resp.status !== 400) {
      return c.json({ error: "Could not connect to Supabase. Check URL and key." }, 400);
    }
  } catch {
    return c.json({ error: "Network error connecting to Supabase" }, 400);
  }

  const connections = await loadConnections();
  const existing = connections.findIndex((conn) => conn.projectId === projectId);
  const stored: StoredConnection = {
    projectId,
    url,
    anonKeyEncrypted: encrypt(anonKey),
    serviceRoleKeyEncrypted: serviceRoleKey ? encrypt(serviceRoleKey) : undefined,
    connectedAt: new Date().toISOString(),
  };

  if (existing >= 0) connections[existing] = stored;
  else connections.push(stored);
  await saveConnections(connections);

  return c.json({ success: true, message: "Supabase connected successfully!" });
});

// GET /supabase/:projectId/tables
app.get("/:projectId/tables", async (c) => {
  const connections = await loadConnections();
  const conn = connections.find((conn) => conn.projectId === c.req.param("projectId"));
  if (!conn) return c.json({ error: "Not connected" }, 404);

  const anonKey = decrypt(conn.anonKeyEncrypted);
  const resp = await fetch(`${conn.url}/rest/v1/`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const data = await resp.json();
  return c.json(data);
});

// GET /supabase/:projectId/status
app.get("/:projectId/status", async (c) => {
  const connections = await loadConnections();
  const conn = connections.find((conn) => conn.projectId === c.req.param("projectId"));
  if (!conn) return c.json({ connected: false });
  return c.json({ connected: true, url: conn.url, connectedAt: conn.connectedAt });
});

// DELETE /supabase/:projectId/disconnect
app.delete("/:projectId/disconnect", async (c) => {
  const connections = await loadConnections();
  const idx = connections.findIndex((conn) => conn.projectId === c.req.param("projectId"));
  if (idx >= 0) connections.splice(idx, 1);
  await saveConnections(connections);
  return c.json({ success: true });
});

// POST /supabase/:projectId/query - run SQL
app.post("/:projectId/query", async (c) => {
  const connections = await loadConnections();
  const conn = connections.find((conn) => conn.projectId === c.req.param("projectId"));
  if (!conn) return c.json({ error: "Not connected" }, 404);

  const { sql } = await c.req.json<{ sql: string }>();
  const serviceKey = conn.serviceRoleKeyEncrypted
    ? decrypt(conn.serviceRoleKeyEncrypted)
    : decrypt(conn.anonKeyEncrypted);

  const resp = await fetch(`${conn.url}/rest/v1/rpc/query`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const data = await resp.json();
  return c.json(data);
});

export const supabaseRouter = app;
