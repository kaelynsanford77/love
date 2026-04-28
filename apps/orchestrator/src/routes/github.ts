import { Hono } from 'hono';
import { join } from 'path';
import { existsSync } from 'fs';

export const githubRoutes = new Hono();

const WORKSPACES_ROOT = process.env.WORKSPACES_ROOT ?? './workspaces';

function normalizeGitUrl(input: string): string {
  if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('git@')) {
    return input;
  }
  // owner/repo shorthand
  if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(input)) {
    return `https://github.com/${input}.git`;
  }
  return input;
}

async function detectFramework(dir: string): Promise<{
  framework: string;
  packageManager: string;
  devCommand: string;
  port: number;
  name: string;
}> {
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) {
    return { framework: 'unknown', packageManager: 'npm', devCommand: 'npm run dev', port: 3000, name: 'project' };
  }
  const pkg = JSON.parse(await Bun.file(pkgPath).text()) as {
    name?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const name = pkg.name ?? 'project';

  let framework = 'vite';
  let devCommand = 'bun run dev';
  let port = 5173;

  if (deps['next']) { framework = 'next'; devCommand = 'bun run dev'; port = 3000; }
  else if (deps['nuxt'] || deps['nuxt3']) { framework = 'nuxt'; devCommand = 'bun run dev'; port = 3000; }
  else if (deps['@sveltejs/kit']) { framework = 'sveltekit'; devCommand = 'bun run dev'; port = 5173; }
  else if (deps['@angular/core']) { framework = 'angular'; devCommand = 'bun run start'; port = 4200; }
  else if (deps['remix']) { framework = 'remix'; devCommand = 'bun run dev'; port = 3000; }
  else if (deps['astro']) { framework = 'astro'; devCommand = 'bun run dev'; port = 4321; }
  else if (deps['vue']) { framework = 'vue'; devCommand = 'bun run dev'; port = 5173; }
  else if (deps['vite']) { framework = 'vite'; devCommand = 'bun run dev'; port = 5173; }

  const packageManager = existsSync(join(dir, 'bun.lock')) || existsSync(join(dir, 'bun.lockb'))
    ? 'bun'
    : existsSync(join(dir, 'pnpm-lock.yaml'))
    ? 'pnpm'
    : existsSync(join(dir, 'yarn.lock'))
    ? 'yarn'
    : 'npm';

  return { framework, packageManager, devCommand, port, name };
}

// POST /github/detect — detect framework from URL without cloning
githubRoutes.post('/detect', async (c) => {
  const body = await c.req.json<{ url: string }>();
  const url = normalizeGitUrl(body.url ?? '');

  // Extract repo name from URL
  const parts = url.replace(/\.git$/, '').split('/');
  const name = parts[parts.length - 1] ?? 'project';

  // We can't run git ls-remote easily without a token, so return basic detection
  return c.json({
    framework: 'vite',
    packageManager: 'bun',
    devCommand: 'bun run dev',
    port: 5173,
    name,
  });
});

// POST /github/import — clone and set up project
githubRoutes.post('/import', async (c) => {
  const body = await c.req.json<{ url: string; branch?: string; name?: string }>();
  const url = normalizeGitUrl(body.url ?? '');

  // Validate branch name (no shell metacharacters)
  const rawBranch = body.branch ?? 'main';
  if (!/^[a-zA-Z0-9/_.-]+$/.test(rawBranch)) {
    return c.json({ error: 'Invalid branch name' }, 400);
  }
  const branch = rawBranch;

  const parts = url.replace(/\.git$/, '').split('/');
  const defaultName = parts[parts.length - 1] ?? 'project';
  const name = (body.name ?? defaultName).replace(/[^a-zA-Z0-9_-]/g, '-');
  const id = `${name}-${Date.now()}`;
  const dir = join(WORKSPACES_ROOT, id);

  // Clone the repo
  const cloneProc = Bun.spawn(
    ['git', 'clone', '--depth=1', '--branch', branch, url, dir],
    { stdout: 'pipe', stderr: 'pipe' }
  );
  const cloneCode = await cloneProc.exited;
  if (cloneCode !== 0) {
    const stderr = await new Response(cloneProc.stderr).text();
    return c.json({ error: `Clone failed: ${stderr}` }, 500);
  }

  // Install dependencies
  const installProc = Bun.spawn(['bun', 'install'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' });
  await installProc.exited;

  // Detect framework
  const info = await detectFramework(dir);

  return c.json({ id, name, dir, ...info });
});
