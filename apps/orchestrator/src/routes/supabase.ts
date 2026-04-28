import { Hono } from 'hono';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export const supabaseRoutes = new Hono();

const VAULT_KEY = process.env.VAULT_ENCRYPTION_KEY;
if (!VAULT_KEY) {
  console.warn('[supabase] VAULT_ENCRYPTION_KEY not set — encrypted credentials will not survive server restarts');
}
const EFFECTIVE_KEY = VAULT_KEY ?? randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

function getKeyBuffer(): Buffer {
  const hex = EFFECTIVE_KEY.slice(0, 64);
  if (hex.length < 64) {
    throw new Error('VAULT_ENCRYPTION_KEY must be at least 32 bytes (64 hex characters)');
  }
  return Buffer.from(hex, 'hex');
}

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getKeyBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const [ivHex, encHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, getKeyBuffer(), iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

// In-memory store (replace with SQLite in production)
const connections = new Map<string, { url: string; encryptedAnonKey: string; encryptedServiceKey: string }>();

// POST /supabase/connect
supabaseRoutes.post('/connect', async (c) => {
  const body = await c.req.json<{ url: string; anonKey: string; serviceKey?: string }>();
  const { url, anonKey, serviceKey = '' } = body;

  // Validate connection
  if (url.startsWith('http')) {
    try {
      const testRes = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      if (!testRes.ok && testRes.status !== 404) {
        return c.json({ error: 'Connection test failed', status: testRes.status }, 400);
      }
    } catch (err) {
      return c.json({ error: 'Cannot reach Supabase URL', details: String(err) }, 400);
    }
  }

  const encryptedAnonKey = anonKey ? encrypt(anonKey) : '';
  const encryptedServiceKey = serviceKey ? encrypt(serviceKey) : '';
  connections.set('default', { url, encryptedAnonKey, encryptedServiceKey });

  // Generate client code snippet
  const clientCode = `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${url}'
const supabaseAnonKey = '${anonKey}'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)`;

  return c.json({ ok: true, clientCode });
});

// POST /supabase/types — generate TypeScript types
supabaseRoutes.post('/types', async (c) => {
  const conn = connections.get('default');
  if (!conn) return c.json({ error: 'Not connected' }, 400);

  // In a real implementation, this would call supabase gen types typescript
  // For now return a stub
  const types = `// Generated Supabase types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      // Add your tables here
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}`;

  return c.json({ types, url: conn.url });
});

// POST /supabase/query — proxy SQL
supabaseRoutes.post('/query', async (c) => {
  const conn = connections.get('default');
  if (!conn) return c.json({ error: 'Not connected' }, 400);

  const body = await c.req.json<{ sql: string }>();
  const serviceKey = conn.encryptedServiceKey ? decrypt(conn.encryptedServiceKey) : '';

  if (!serviceKey) return c.json({ error: 'Service role key required for SQL queries' }, 400);

  try {
    const res = await fetch(`${conn.url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: body.sql }),
    });
    const data = await res.json();
    return c.json(data);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
