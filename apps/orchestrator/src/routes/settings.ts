import { Hono } from "hono";
import { getDb } from "../db";

const router = new Hono();

// ─── GET /settings ────────────────────────────────────────────────────────────
router.get("/", (c) => {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as any[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return c.json({ settings });
});

// ─── PUT /settings ────────────────────────────────────────────────────────────
router.put("/", async (c) => {
  const db = getDb();
  const body = await c.req.json() as Record<string, string>;
  const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  for (const [key, value] of Object.entries(body)) {
    stmt.run(key, String(value));
  }
  return c.json({ ok: true });
});

// ─── GET /settings/:key ───────────────────────────────────────────────────────
router.get("/:key", (c) => {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(c.req.param("key")) as any;
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ value: row.value });
});

// ─── DELETE /settings/:key ────────────────────────────────────────────────────
router.delete("/:key", (c) => {
  const db = getDb();
  db.prepare("DELETE FROM settings WHERE key = ?").run(c.req.param("key"));
  return c.json({ ok: true });
});

export const settingsRouter = router;
