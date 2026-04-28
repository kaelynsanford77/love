import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getDb } from "../db";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const execFileAsync = promisify(execFile);
const router = new Hono();

const WORKSPACES_DIR = () =>
  path.resolve(process.env.WORKSPACES_DIR || path.join(process.cwd(), "workspaces"));

// Active dev servers
const runtimes = new Map<
  string,
  { pid: number; port: number; status: string }
>();

let currentActiveProject: string | null = null;

// ─── Helper: allocate port ────────────────────────────────────────────────────
function allocatePort(): number {
  const used = new Set([...runtimes.values()].map((r) => r.port));
  for (let p = 5200; p <= 5299; p++) {
    if (!used.has(p)) return p;
  }
  throw new Error("No ports available in range 5200-5299");
}

// ─── Helper: detect framework ─────────────────────────────────────────────────
function detectFramework(projectPath: string): string {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectPath, "package.json"), "utf-8")
    );
    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    if (deps["next"]) return "nextjs";
    if (deps["vite"] && deps["react"]) return "vite-react";
    if (deps["@sveltejs/kit"]) return "sveltekit";
    if (deps["nuxt"]) return "nuxt";
    if (deps["react"]) return "react";
    if (deps["vue"]) return "vue";
  } catch {}
  return "unknown";
}

// ─── GET /projects ────────────────────────────────────────────────────────────
router.get("/", (c) => {
  const db = getDb();
  const projects = db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all();
  return c.json({ projects });
});

// ─── POST /projects ───────────────────────────────────────────────────────────
const createSchema = z.object({
  name: z.string().min(1),
  template: z
    .enum(["blank", "with-supabase", "from-github"])
    .default("blank"),
  description: z.string().optional(),
});

router.post(
  "/",
  zValidator("json", createSchema),
  async (c) => {
    const { name, template, description } = c.req.valid("json");
    const db = getDb();
    const id = crypto.randomUUID();
    const wsDir = WORKSPACES_DIR();
    const projectPath = path.join(wsDir, id);

    fs.mkdirSync(projectPath, { recursive: true });

    // Scaffold project
    await scaffoldProject(projectPath, template, name);

    const port = allocatePort();
    const now = Date.now();

    db.prepare(
      `INSERT INTO projects (id, name, description, framework, port, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'stopped', ?, ?)`
    ).run(id, name, description || "", detectFramework(projectPath), port, now, now);

    // Start dev server
    startDevServer(id, projectPath, port);

    return c.json({ id, name, port, status: "starting" }, 201);
  }
);

// ─── GET /projects/:id ───────────────────────────────────────────────────────
router.get("/:id", (c) => {
  const db = getDb();
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(c.req.param("id"));
  if (!project) return c.json({ error: "Not found" }, 404);
  return c.json(project);
});

// ─── PATCH /projects/:id ─────────────────────────────────────────────────────
router.patch("/:id", async (c) => {
  const db = getDb();
  const id = c.req.param("id");
  const body = await c.req.json();
  const allowed = ["name", "description", "github_remote"];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );
  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No valid fields" }, 400);
  }
  const set = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  db.prepare(
    `UPDATE projects SET ${set}, updated_at = ? WHERE id = ?`
  ).run(...Object.values(updates), Date.now(), id);
  return c.json({ ok: true });
});

// ─── DELETE /projects/:id ────────────────────────────────────────────────────
router.delete("/:id", async (c) => {
  const db = getDb();
  const id = c.req.param("id");

  // Stop dev server
  const rt = runtimes.get(id);
  if (rt) {
    try {
      process.kill(rt.pid, "SIGTERM");
    } catch {}
    runtimes.delete(id);
  }

  db.prepare("DELETE FROM projects WHERE id = ?").run(id);

  // Optionally remove files
  const projectPath = path.join(WORKSPACES_DIR(), id);
  try {
    fs.rmSync(projectPath, { recursive: true, force: true });
  } catch {}

  return c.json({ ok: true });
});

// ─── POST /projects/:id/activate ─────────────────────────────────────────────
router.post("/:id/activate", async (c) => {
  const id = c.req.param("id");
  const db = getDb();
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;
  if (!project) return c.json({ error: "Not found" }, 404);

  // Stop current active
  if (currentActiveProject && currentActiveProject !== id) {
    const rt = runtimes.get(currentActiveProject);
    if (rt) {
      try { process.kill(rt.pid, "SIGTERM"); } catch {}
      runtimes.delete(currentActiveProject);
      db.prepare("UPDATE projects SET status = 'stopped', pid = NULL WHERE id = ?").run(currentActiveProject);
    }
  }

  currentActiveProject = id;

  // Start if not running
  const rt = runtimes.get(id);
  if (!rt || rt.status !== "running") {
    const projectPath = path.join(WORKSPACES_DIR(), id);
    startDevServer(id, projectPath, project.port || allocatePort());
  }

  db.prepare("UPDATE projects SET updated_at = ?, last_activity = ? WHERE id = ?").run(Date.now(), Date.now(), id);
  return c.json({ ok: true, runtime: runtimes.get(id) });
});

// ─── POST /projects/import ───────────────────────────────────────────────────
const importSchema = z.object({
  repoUrl: z.string().url(),
  branch: z.string().default("main"),
  name: z.string().optional(),
});

router.post("/import", zValidator("json", importSchema), async (c) => {
  const { repoUrl, branch, name } = c.req.valid("json");
  const db = getDb();

  const repoName =
    name ||
    repoUrl
      .replace(/\.git$/, "")
      .split("/")
      .pop() ||
    "imported-project";

  const id = crypto.randomUUID();
  const wsDir = WORKSPACES_DIR();
  const projectPath = path.join(wsDir, id);

  fs.mkdirSync(wsDir, { recursive: true });

  try {
    // Clone repo (use execFile with args array to prevent injection)
    await execFileAsync(
      "git",
      ["clone", "--depth", "1", "--branch", branch, repoUrl, projectPath],
      { timeout: 60000 }
    );

    // Install deps
    const hasBun = fs.existsSync(path.join(projectPath, "bun.lockb"));
    const mgr = hasBun ? "bun" : "npm";
    await execFileAsync(mgr, ["install"], { cwd: projectPath, timeout: 120000 });

    const framework = detectFramework(projectPath);
    const port = allocatePort();
    const now = Date.now();

    db.prepare(
      `INSERT INTO projects (id, name, description, framework, port, status, github_remote, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'stopped', ?, ?, ?)`
    ).run(id, repoName, `Imported from ${repoUrl}`, framework, port, repoUrl, now, now);

    // Initialize .lovable metadata
    const lovableMeta = path.join(projectPath, ".lovable");
    fs.mkdirSync(lovableMeta, { recursive: true });
    fs.writeFileSync(
      path.join(lovableMeta, "project.json"),
      JSON.stringify({ id, name: repoName, framework, importedFrom: repoUrl, importedAt: now }, null, 2)
    );

    // Start dev server
    startDevServer(id, projectPath, port);

    return c.json({ projectId: id, framework, status: "starting", port }, 201);
  } catch (e) {
    fs.rmSync(projectPath, { recursive: true, force: true });
    return c.json({ error: String(e) }, 500);
  }
});

// ─── POST /projects/import-github (authenticated) ────────────────────────────
const importGithubSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  branch: z.string().default("main"),
  name: z.string().optional(),
  token: z.string(),
});

router.post("/import-github", zValidator("json", importGithubSchema), async (c) => {
  const { owner, repo, branch, name, token } = c.req.valid("json");
  const repoUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
  const importBody = { repoUrl, branch, name: name || repo };
  
  // Delegate to the public import handler
  const db = getDb();
  const repoName = importBody.name || repo;
  const id = crypto.randomUUID();
  const wsDir = WORKSPACES_DIR();
  const projectPath = path.join(wsDir, id);
  fs.mkdirSync(wsDir, { recursive: true });

  try {
    await execFileAsync(
      "git",
      ["clone", "--depth", "1", "--branch", branch, repoUrl, projectPath],
      { timeout: 60000 }
    );
    await execFileAsync("bun", ["install"], { cwd: projectPath, timeout: 120000 });

    const framework = detectFramework(projectPath);
    const port = allocatePort();
    const now = Date.now();

    db.prepare(
      `INSERT INTO projects (id, name, description, framework, port, status, github_remote, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'stopped', ?, ?, ?)`
    ).run(id, repoName, `Imported from github.com/${owner}/${repo}`, framework, port, `https://github.com/${owner}/${repo}`, now, now);

    startDevServer(id, projectPath, port);

    return c.json({ projectId: id, framework, status: "starting", port }, 201);
  } catch (e) {
    fs.rmSync(projectPath, { recursive: true, force: true });
    return c.json({ error: String(e) }, 500);
  }
});

// ─── GET /projects/:id/runtime ───────────────────────────────────────────────
router.get("/:id/runtime", (c) => {
  const id = c.req.param("id");
  const rt = runtimes.get(id);
  return c.json(rt || { status: "stopped" });
});

// ─── POST /projects/:id/stop ─────────────────────────────────────────────────
router.post("/:id/stop", (c) => {
  const id = c.req.param("id");
  const rt = runtimes.get(id);
  const db = getDb();
  if (rt) {
    try { process.kill(rt.pid, "SIGTERM"); } catch {}
    runtimes.delete(id);
    db.prepare("UPDATE projects SET status = 'stopped', pid = NULL WHERE id = ?").run(id);
  }
  return c.json({ ok: true });
});

// ─── POST /projects/:id/duplicate ───────────────────────────────────────────
router.post("/:id/duplicate", async (c) => {
  const db = getDb();
  const id = c.req.param("id");
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;
  if (!project) return c.json({ error: "Not found" }, 404);

  const newId = crypto.randomUUID();
  const srcPath = path.join(WORKSPACES_DIR(), id);
  const dstPath = path.join(WORKSPACES_DIR(), newId);

  try {
    // Use Node fs.cpSync instead of shell cp to avoid injection
    fs.cpSync(srcPath, dstPath, { recursive: true });
    const port = allocatePort();
    const now = Date.now();
    db.prepare(
      `INSERT INTO projects (id, name, description, framework, port, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'stopped', ?, ?)`
    ).run(newId, `${project.name} (copy)`, project.description, project.framework, port, now, now);
    return c.json({ id: newId }, 201);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ─── POST /projects/:id/export ───────────────────────────────────────────────
router.get("/:id/export", async (c) => {
  const id = c.req.param("id");
  const projectPath = path.join(WORKSPACES_DIR(), id);
  if (!fs.existsSync(projectPath)) return c.json({ error: "Not found" }, 404);

  // Return as ZIP using archiver
  const archiver = await import("archiver");
  const archive = archiver.default("zip", { zlib: { level: 9 } });

  c.header("Content-Type", "application/zip");
  c.header("Content-Disposition", `attachment; filename="project-${id}.zip"`);

  return new Response(
    new ReadableStream({
      start(controller) {
        archive.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        archive.on("end", () => controller.close());
        archive.on("error", (e: Error) => controller.error(e));
        archive.directory(projectPath, false);
        archive.finalize();
      },
    })
  );
});

// ─── Internal helpers ─────────────────────────────────────────────────────────
async function scaffoldProject(
  projectPath: string,
  template: string,
  name: string
): Promise<void> {
  // Write a minimal Vite+React+Tailwind project
  const pkg = {
    name: name.toLowerCase().replace(/\s+/g, "-"),
    version: "0.0.1",
    private: true,
    type: "module",
    scripts: {
      dev: "vite --port $PORT",
      build: "tsc && vite build",
      preview: "vite preview",
    },
    dependencies: {
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      ...(template === "with-supabase"
        ? { "@supabase/supabase-js": "^2.44.0" }
        : {}),
    },
    devDependencies: {
      "@types/react": "^18.3.3",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.1",
      vite: "^5.3.4",
      typescript: "^5.5.3",
      tailwindcss: "^3.4.4",
      autoprefixer: "^10.4.19",
      postcss: "^8.4.39",
    },
  };

  fs.mkdirSync(path.join(projectPath, "src"), { recursive: true });
  fs.mkdirSync(path.join(projectPath, "public"), { recursive: true });

  fs.writeFileSync(
    path.join(projectPath, "package.json"),
    JSON.stringify(pkg, null, 2)
  );

  fs.writeFileSync(
    path.join(projectPath, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  );

  fs.writeFileSync(
    path.join(projectPath, "vite.config.ts"),
    `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()] });
`
  );

  fs.writeFileSync(
    path.join(projectPath, "src/main.tsx"),
    `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
  );

  fs.writeFileSync(
    path.join(projectPath, "src/App.tsx"),
    `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-purple-600 mb-4">✨ ${name}</h1>
        <p className="text-gray-600">Start building your app by chatting with the AI!</p>
      </div>
    </div>
  );
}
`
  );

  fs.writeFileSync(
    path.join(projectPath, "src/index.css"),
    `@tailwind base;
@tailwind components;
@tailwind utilities;
`
  );

  fs.writeFileSync(
    path.join(projectPath, "tailwind.config.js"),
    `export default { content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], theme: { extend: {} }, plugins: [] };
`
  );

  fs.writeFileSync(
    path.join(projectPath, "postcss.config.js"),
    `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
`
  );

  fs.writeFileSync(
    path.join(projectPath, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
          strict: true,
          paths: { "@/*": ["./src/*"] },
        },
        include: ["src"],
        references: [{ path: "./tsconfig.node.json" }],
      },
      null,
      2
    )
  );

  if (template === "with-supabase") {
    fs.mkdirSync(path.join(projectPath, "src/integrations/supabase/hooks"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(projectPath, "src/integrations/supabase/client.ts"),
      `import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
`
    );
  }
}

function startDevServer(
  projectId: string,
  projectPath: string,
  port: number
): void {
  const db = getDb();
  if (!fs.existsSync(projectPath)) return;

  const child = spawn("bun", ["run", "dev"], {
    cwd: projectPath,
    env: { ...process.env, PORT: String(port) },
    detached: false,
    stdio: "pipe",
  });

  runtimes.set(projectId, {
    pid: child.pid!,
    port,
    status: "starting",
  });

  db.prepare("UPDATE projects SET status = 'starting', pid = ?, port = ? WHERE id = ?").run(
    child.pid!,
    port,
    projectId
  );

  child.stdout?.on("data", (data: Buffer) => {
    const out = data.toString();
    if (out.includes("localhost") || out.includes("ready")) {
      const rt = runtimes.get(projectId);
      if (rt) {
        runtimes.set(projectId, { ...rt, status: "running" });
        db.prepare("UPDATE projects SET status = 'running' WHERE id = ?").run(projectId);
      }
    }
  });

  child.on("exit", () => {
    runtimes.delete(projectId);
    db.prepare("UPDATE projects SET status = 'stopped', pid = NULL WHERE id = ?").run(projectId);
  });
}

export const projectsRouter = router;
