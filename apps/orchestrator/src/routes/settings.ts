import { Hono } from "hono";
import { join } from "path";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";

const app = new Hono();
const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), "data");
const SETTINGS_FILE = join(DATA_DIR, "settings.json");

const defaultSettings = {
  llm: {
    routing: "auto",
    fastModel: "claude-haiku-4-5-20251001",
    standardModel: "claude-sonnet-4-6-thinking",
    powerfulModel: "claude-opus-4-6-thinking",
    baseUrl: "https://api.quatarly.cloud/v1",
  },
  editor: { fontSize: 14, theme: "dark", tabSize: 2, wordWrap: true, minimap: false },
  preview: { autoRefresh: true, showDevTools: false },
  git: { defaultBranch: "main", autoCommit: false, commitMessage: "AI: {description}" },
  mobile: { enableCapacitor: false, pushNotifications: false },
};

app.get("/", async (c) => {
  if (!existsSync(SETTINGS_FILE)) return c.json(defaultSettings);
  return c.json(JSON.parse(await readFile(SETTINGS_FILE, "utf-8")));
});

app.put("/", async (c) => {
  const settings = await c.req.json();
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  return c.json(settings);
});

app.patch("/", async (c) => {
  const existing = existsSync(SETTINGS_FILE)
    ? JSON.parse(await readFile(SETTINGS_FILE, "utf-8"))
    : defaultSettings;
  const updates = await c.req.json();
  const merged = { ...existing, ...updates };
  await writeFile(SETTINGS_FILE, JSON.stringify(merged, null, 2));
  return c.json(merged);
});

export const settingsRouter = app;
