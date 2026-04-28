import { Hono } from "hono";
import path from "path";
import fs from "fs";

const router = new Hono();

const WORKSPACES_DIR = () =>
  path.resolve(process.env.WORKSPACES_DIR || path.join(process.cwd(), "workspaces"));

function safeProjectPath(projectId: string, filePath: string): string | null {
  const projectPath = path.join(WORKSPACES_DIR(), projectId);
  const full = path.join(projectPath, filePath);
  if (!full.startsWith(projectPath)) return null;
  return full;
}

// ─── GET /files/:projectId/tree ───────────────────────────────────────────────
router.get("/:projectId/tree", (c) => {
  const projectId = c.req.param("projectId");
  const projectPath = path.join(WORKSPACES_DIR(), projectId);

  if (!fs.existsSync(projectPath)) {
    return c.json({ error: "Project not found" }, 404);
  }

  const IGNORE = new Set([
    "node_modules", ".git", "dist", "build", ".next", ".nuxt",
    "coverage", ".cache", "__pycache__", ".DS_Store",
  ]);

  function buildTree(dir: string, base = ""): unknown[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries
      .filter((e) => !IGNORE.has(e.name))
      .map((e) => {
        const rel = path.join(base, e.name);
        if (e.isDirectory()) {
          return { name: e.name, path: rel, type: "dir", children: buildTree(path.join(dir, e.name), rel) };
        }
        const stat = fs.statSync(path.join(dir, e.name));
        return { name: e.name, path: rel, type: "file", size: stat.size };
      })
      .sort((a: any, b: any) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }

  return c.json({ tree: buildTree(projectPath) });
});

// ─── GET /files/:projectId/read ───────────────────────────────────────────────
router.get("/:projectId/read", (c) => {
  const projectId = c.req.param("projectId");
  const filePath = c.req.query("path") || "";
  const fullPath = safeProjectPath(projectId, filePath);

  if (!fullPath) return c.json({ error: "Invalid path" }, 400);
  if (!fs.existsSync(fullPath)) return c.json({ error: "File not found" }, 404);

  const content = fs.readFileSync(fullPath, "utf-8");
  return c.json({ content, path: filePath });
});

// ─── POST /files/:projectId/write ─────────────────────────────────────────────
router.post("/:projectId/write", async (c) => {
  const projectId = c.req.param("projectId");
  const { path: filePath, content } = await c.req.json();
  const fullPath = safeProjectPath(projectId, filePath);

  if (!fullPath) return c.json({ error: "Invalid path" }, 400);

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf-8");

  return c.json({ ok: true, path: filePath });
});

// ─── DELETE /files/:projectId ────────────────────────────────────────────────
router.delete("/:projectId", async (c) => {
  const projectId = c.req.param("projectId");
  const { path: filePath } = await c.req.json();
  const fullPath = safeProjectPath(projectId, filePath);

  if (!fullPath) return c.json({ error: "Invalid path" }, 400);
  if (!fs.existsSync(fullPath)) return c.json({ error: "Not found" }, 404);

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    fs.rmSync(fullPath, { recursive: true });
  } else {
    fs.unlinkSync(fullPath);
  }

  return c.json({ ok: true });
});

// ─── POST /files/:projectId/rename ───────────────────────────────────────────
router.post("/:projectId/rename", async (c) => {
  const projectId = c.req.param("projectId");
  const { from, to } = await c.req.json();
  const fromPath = safeProjectPath(projectId, from);
  const toPath = safeProjectPath(projectId, to);

  if (!fromPath || !toPath) return c.json({ error: "Invalid path" }, 400);
  if (!fs.existsSync(fromPath)) return c.json({ error: "Source not found" }, 404);

  fs.mkdirSync(path.dirname(toPath), { recursive: true });
  fs.renameSync(fromPath, toPath);

  return c.json({ ok: true });
});

// ─── POST /files/:projectId/mkdir ────────────────────────────────────────────
router.post("/:projectId/mkdir", async (c) => {
  const projectId = c.req.param("projectId");
  const { path: dirPath } = await c.req.json();
  const fullPath = safeProjectPath(projectId, dirPath);

  if (!fullPath) return c.json({ error: "Invalid path" }, 400);

  fs.mkdirSync(fullPath, { recursive: true });
  return c.json({ ok: true });
});

// ─── GET /files/:projectId/search ────────────────────────────────────────────
router.get("/:projectId/search", async (c) => {
  const projectId = c.req.param("projectId");
  const query = c.req.query("q") || "";
  const projectPath = path.join(WORKSPACES_DIR(), projectId);

  if (!fs.existsSync(projectPath)) return c.json({ error: "Not found" }, 404);

  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  try {
    const { stdout } = await execAsync(
      `rg --json -l "${query.replace(/"/g, '\\"')}" --glob "!node_modules" --glob "!.git" .`,
      { cwd: projectPath }
    );
    const files = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          const obj = JSON.parse(line);
          return obj.type === "match" ? obj.data.path.text : null;
        } catch {
          return line;
        }
      })
      .filter(Boolean);
    return c.json({ files });
  } catch {
    return c.json({ files: [] });
  }
});

export const filesRouter = router;
