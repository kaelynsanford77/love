import { Hono } from "hono";
import { join } from "path";
import { mkdir, readFile, writeFile, rm } from "fs/promises";
import { existsSync } from "fs";
import { execSync } from "child_process";
import type { Project, ImportConfig } from "@love/shared";
import { randomUUID } from "crypto";

const app = new Hono();
const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), "data");
const PROJECTS_FILE = join(DATA_DIR, "projects.json");

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
}

async function loadProjects(): Promise<Project[]> {
  await ensureDataDir();
  if (!existsSync(PROJECTS_FILE)) return [];
  const raw = await readFile(PROJECTS_FILE, "utf-8");
  return JSON.parse(raw);
}

async function saveProjects(projects: Project[]) {
  await ensureDataDir();
  await writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

// GET /projects
app.get("/", async (c) => {
  const projects = await loadProjects();
  return c.json(projects);
});

// GET /projects/:id
app.get("/:id", async (c) => {
  const projects = await loadProjects();
  const project = projects.find((p) => p.id === c.req.param("id"));
  if (!project) return c.json({ error: "Not found" }, 404);
  return c.json(project);
});

// POST /projects - create new project
app.post("/", async (c) => {
  const body = await c.req.json<{ name: string; template?: string; description?: string }>();
  const projects = await loadProjects();

  const project: Project = {
    id: randomUUID(),
    name: body.name,
    framework: body.template ?? "react-vite",
    status: "idle",
    lastModified: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    description: body.description,
  };

  const projectDir = join(DATA_DIR, "projects", project.id);
  await mkdir(projectDir, { recursive: true });

  await writeFile(
    join(projectDir, "package.json"),
    JSON.stringify(
      {
        name: project.name.toLowerCase().replace(/\s+/g, "-"),
        version: "0.0.1",
        scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
        dependencies: { react: "^18.0.0", "react-dom": "^18.0.0" },
        devDependencies: {
          vite: "^5.0.0",
          "@vitejs/plugin-react": "^4.0.0",
          typescript: "^5.0.0",
        },
      },
      null,
      2
    )
  );

  await writeFile(
    join(projectDir, "index.html"),
    `<!DOCTYPE html>
<html>
<head><title>${body.name}</title></head>
<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>`
  );

  await mkdir(join(projectDir, "src"), { recursive: true });
  await writeFile(
    join(projectDir, "src", "main.tsx"),
    `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
`
  );
  await writeFile(
    join(projectDir, "src", "App.tsx"),
    `export default function App() {
  return <div style={{padding:'2rem', fontFamily:'sans-serif'}}><h1>${body.name}</h1><p>Start building with Lovable AI!</p></div>;
}
`
  );

  projects.push(project);
  await saveProjects(projects);

  return c.json(project, 201);
});

// PATCH /projects/:id - update project
app.patch("/:id", async (c) => {
  const projects = await loadProjects();
  const idx = projects.findIndex((p) => p.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "Not found" }, 404);

  const updates = await c.req.json();
  projects[idx] = { ...projects[idx], ...updates, lastModified: new Date().toISOString() };
  await saveProjects(projects);
  return c.json(projects[idx]);
});

// DELETE /projects/:id
app.delete("/:id", async (c) => {
  const projects = await loadProjects();
  const idx = projects.findIndex((p) => p.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "Not found" }, 404);

  const [removed] = projects.splice(idx, 1);
  const projectDir = join(DATA_DIR, "projects", removed.id);
  if (existsSync(projectDir)) await rm(projectDir, { recursive: true });

  await saveProjects(projects);
  return c.json({ success: true });
});

// POST /projects/import - import from GitHub
app.post("/import", async (c) => {
  const body = await c.req.json<ImportConfig>();
  const { repoUrl, branch = "main", name } = body;

  if (!repoUrl || !repoUrl.startsWith("https://github.com/")) {
    return c.json({ error: "Invalid GitHub repo URL" }, 400);
  }

  const repoName =
    name ?? repoUrl.split("/").pop()?.replace(".git", "") ?? "imported-project";

  const projects = await loadProjects();
  const project: Project = {
    id: randomUUID(),
    name: repoName,
    framework: "unknown",
    githubRemote: repoUrl,
    status: "idle",
    lastModified: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    description: `Imported from ${repoUrl}`,
  };

  const projectDir = join(DATA_DIR, "projects", project.id);
  await mkdir(projectDir, { recursive: true });

  try {
    execSync(`git clone --branch ${branch} --depth 1 ${repoUrl} .`, {
      cwd: projectDir,
      timeout: 60000,
      stdio: "pipe",
    });
  } catch {
    await rm(projectDir, { recursive: true });
    return c.json({ error: "Failed to clone repository. Check URL and branch." }, 400);
  }

  const pkgPath = join(projectDir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      if (deps.next) project.framework = "nextjs";
      else if (deps.nuxt) project.framework = "nuxt";
      else if (deps.vite && (deps.react || deps["@vitejs/plugin-react"]))
        project.framework = "react-vite";
      else if (deps["@sveltejs/kit"]) project.framework = "sveltekit";
      else if (deps.remix || deps["@remix-run/node"]) project.framework = "remix";
      else if (deps.astro) project.framework = "astro";
      else if (deps.react) project.framework = "react";
      else project.framework = "nodejs";
    } catch {}
  }

  projects.push(project);
  await saveProjects(projects);

  return c.json(
    { ...project, message: "Import complete! Framework detected: " + project.framework },
    201
  );
});

// POST /projects/:id/start - start dev server
app.post("/:id/start", async (c) => {
  const projects = await loadProjects();
  const project = projects.find((p) => p.id === c.req.param("id"));
  if (!project) return c.json({ error: "Not found" }, 404);

  const usedPorts = projects.filter((p) => p.devPort).map((p) => p.devPort!);
  let port = 5200;
  while (usedPorts.includes(port)) port++;

  project.devPort = port;
  project.status = "running";
  project.lastModified = new Date().toISOString();
  await saveProjects(projects);

  return c.json({ ...project, url: `http://localhost:${port}` });
});

// POST /projects/:id/stop
app.post("/:id/stop", async (c) => {
  const projects = await loadProjects();
  const idx = projects.findIndex((p) => p.id === c.req.param("id"));
  if (idx === -1) return c.json({ error: "Not found" }, 404);

  projects[idx].status = "stopped";
  projects[idx].devPort = undefined;
  await saveProjects(projects);
  return c.json(projects[idx]);
});

// GET /projects/:id/files - list files
app.get("/:id/files", async (c) => {
  const projectDir = join(DATA_DIR, "projects", c.req.param("id"));
  if (!existsSync(projectDir)) return c.json({ error: "Project not found" }, 404);

  async function buildTree(dir: string, base = ""): Promise<object[]> {
    const { readdir, stat } = await import("fs/promises");
    const items = await readdir(dir);
    const result = [];
    for (const item of items) {
      if (
        item === "node_modules" ||
        item === ".git" ||
        item === "dist" ||
        item === ".next"
      )
        continue;
      const fullPath = join(dir, item);
      const relativePath = base ? `${base}/${item}` : item;
      const s = await stat(fullPath);
      if (s.isDirectory()) {
        result.push({
          id: relativePath,
          name: item,
          path: relativePath,
          type: "directory",
          children: await buildTree(fullPath, relativePath),
        });
      } else {
        result.push({ id: relativePath, name: item, path: relativePath, type: "file" });
      }
    }
    return result;
  }

  return c.json(await buildTree(projectDir));
});

// GET /projects/:id/files/* - read file
app.get("/:id/files/*", async (c) => {
  const projectId = c.req.param("id");
  const rest = c.req.url.split(`/projects/${projectId}/files/`)[1];
  const projectDir = join(DATA_DIR, "projects", projectId);
  const fullPath = join(projectDir, decodeURIComponent(rest ?? ""));
  if (!existsSync(fullPath)) return c.json({ error: "File not found" }, 404);
  const content = await readFile(fullPath, "utf-8");
  return c.json({ content, path: rest });
});

// PUT /projects/:id/files/* - write file
app.put("/:id/files/*", async (c) => {
  const projectId = c.req.param("id");
  const rest = c.req.url.split(`/projects/${projectId}/files/`)[1];
  const { content } = await c.req.json<{ content: string }>();
  const projectDir = join(DATA_DIR, "projects", projectId);
  const fullPath = join(projectDir, decodeURIComponent(rest ?? ""));
  const { mkdir: mkdirFs } = await import("fs/promises");
  await mkdirFs(join(fullPath, ".."), { recursive: true });
  await writeFile(fullPath, content, "utf-8");

  const projects = await loadProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx !== -1) {
    projects[idx].lastModified = new Date().toISOString();
    await saveProjects(projects);
  }
  return c.json({ success: true, path: rest });
});

export const projectsRouter = app;
