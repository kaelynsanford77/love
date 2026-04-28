import { Router } from 'express';
import { z } from 'zod';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getDb } from '../db.js';

const router = Router();

const WORKSPACES_DIR = process.env.WORKSPACES_DIR ?? join(process.cwd(), '..', '..', 'workspaces');

const detectSchema = z.object({
  url: z.string().url(),
});

const importSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1).max(100).optional(),
  framework: z.string().optional(),
  packageManager: z.string().optional().default('npm'),
  devCommand: z.string().optional(),
  port: z.number().optional(),
});

/**
 * Detect framework from a cloned directory or from public repo file listing.
 * In offline/demo mode (no actual clone), returns heuristics based on repo name.
 */
function detectFramework(dir: string): {
  framework: string;
  packageManager: string;
  devCommand: string;
  port: number;
} {
  const files = existsSync(dir) ? readdirSync(dir) : [];
  const hasFile = (name: string) => files.includes(name);

  let framework = 'unknown';
  let packageManager = 'npm';
  let devCommand = 'npm run dev';
  let port = 3000;

  if (hasFile('next.config.js') || hasFile('next.config.ts') || hasFile('next.config.mjs')) {
    framework = 'next';
    devCommand = 'npm run dev';
    port = 3000;
  } else if (hasFile('nuxt.config.ts') || hasFile('nuxt.config.js')) {
    framework = 'nuxt';
    devCommand = 'npm run dev';
    port = 3000;
  } else if (hasFile('vite.config.ts') || hasFile('vite.config.js')) {
    framework = 'react'; // assume react+vite by default
    devCommand = 'npm run dev';
    port = 5173;
    // Check for vue
    if (existsSync(join(dir, 'src', 'App.vue'))) {
      framework = 'vue';
    }
    if (existsSync(join(dir, 'src', 'App.svelte'))) {
      framework = 'svelte';
    }
  } else if (hasFile('svelte.config.js') || hasFile('svelte.config.ts')) {
    framework = 'svelte';
    devCommand = 'npm run dev';
    port = 5173;
  } else if (hasFile('angular.json')) {
    framework = 'angular';
    devCommand = 'ng serve';
    port = 4200;
  } else if (hasFile('package.json')) {
    // Check package.json scripts
    try {
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));
      if (pkg.dependencies?.express || pkg.devDependencies?.express) {
        framework = 'express';
        devCommand = 'node index.js';
        port = 3000;
      }
    } catch {
      // ignore
    }
    framework = framework === 'unknown' ? 'react' : framework;
  }

  if (hasFile('pnpm-lock.yaml')) packageManager = 'pnpm';
  else if (hasFile('yarn.lock')) packageManager = 'yarn';
  else if (hasFile('bun.lockb')) packageManager = 'bun';

  if (packageManager !== 'npm') {
    devCommand = devCommand.replace('npm run', `${packageManager} run`);
  }

  return { framework, packageManager, devCommand, port };
}

// POST /github/detect — detect framework without cloning
router.post('/detect', async (req, res) => {
  try {
    const parsed = detectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const { url } = parsed.data;
    const parts = url.split('/').filter(Boolean);
    const name = parts[parts.length - 1] || 'imported-repo';

    // For demo: do lightweight detection based on repo name heuristics
    // In a real server with git installed, you'd shallow clone and inspect
    let framework = 'react';
    let devCommand = 'npm run dev';
    let port = 5173;
    let packageManager = 'npm';

    const lower = name.toLowerCase();
    if (lower.includes('next') || lower.includes('nextjs')) {
      framework = 'next'; port = 3000;
    } else if (lower.includes('vue') || lower.includes('nuxt')) {
      framework = 'vue'; port = 5173;
    } else if (lower.includes('svelte')) {
      framework = 'svelte'; port = 5173;
    } else if (lower.includes('angular')) {
      framework = 'angular'; devCommand = 'ng serve'; port = 4200;
    } else if (lower.includes('express') || lower.includes('api') || lower.includes('server')) {
      framework = 'express'; devCommand = 'node index.js'; port = 3000;
    }

    res.json({ framework, packageManager, devCommand, port, name });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /github/import — clone + scaffold project
router.post('/import', async (req, res) => {
  try {
    const parsed = importSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const { url, framework, packageManager, devCommand, port } = parsed.data;
    const parts = url.split('/').filter(Boolean);
    const rawName = parts[parts.length - 1] || 'imported-repo';
    const name = rawName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const id = randomUUID();
    const projectDir = join(WORKSPACES_DIR, `${name}-${id.slice(0, 8)}`);

    // Ensure workspaces dir exists
    mkdirSync(WORKSPACES_DIR, { recursive: true });

    // Try to clone (will succeed if git is available)
    try {
      execSync(`git clone --depth=1 "${url}" "${projectDir}"`, {
        timeout: 60000,
        stdio: 'ignore',
      });
    } catch {
      // If git clone fails, create a placeholder directory
      mkdirSync(projectDir, { recursive: true });
    }

    // Detect framework from cloned contents
    const detected = detectFramework(projectDir);
    const finalFramework = framework ?? detected.framework;
    const finalDevCommand = devCommand ?? detected.devCommand;
    const finalPort = port ?? detected.port;
    const finalPM = packageManager ?? detected.packageManager;

    // Save to DB
    try {
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
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO projects (id, name, path, port, framework, github_repo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, rawName, projectDir, finalPort, finalFramework, url, now, now);
    } catch {
      // DB might not be available
    }

    res.status(201).json({
      id,
      name: rawName,
      path: projectDir,
      port: finalPort,
      framework: finalFramework,
      packageManager: finalPM,
      devCommand: finalDevCommand,
      githubRepo: url,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
