import { Hono } from 'hono';
import { execInProject } from '../tools/exec';

export const execRoutes = new Hono();

execRoutes.post('/', async (c) => {
  const body = await c.req.json<{ projectId: string; command: string; cwd?: string }>();
  if (!body.command) return c.json({ error: 'command required' }, 400);

  try {
    const result = await execInProject(
      body.projectId ?? 'default',
      body.command,
      body.cwd
    );
    return c.json(result);
  } catch (e: unknown) {
    return c.json({ error: String(e), stdout: '', stderr: String(e), exitCode: 1 }, 500);
  }
});

execRoutes.post('/npm-install', async (c) => {
  const body = await c.req.json<{ projectId: string; packages?: string[] }>();
  const pkgs = body.packages?.join(' ') ?? '';
  const cmd = pkgs ? `npm install ${pkgs}` : 'npm install';

  const result = await execInProject(body.projectId ?? 'default', cmd);
  return c.json(result);
});
