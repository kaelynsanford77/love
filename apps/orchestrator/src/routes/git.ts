import { Hono } from 'hono';
import { gitLog, gitCommit, gitStatus, gitDiff } from '../sandbox';

export const gitRoutes = new Hono();

gitRoutes.get('/log', async (c) => {
  const projectId = c.req.query('projectId') ?? 'default';
  try {
    const commits = await gitLog(projectId);
    return c.json({ commits });
  } catch (e: unknown) {
    return c.json({ commits: [], error: String(e) });
  }
});

gitRoutes.get('/status', async (c) => {
  const projectId = c.req.query('projectId') ?? 'default';
  try {
    const status = await gitStatus(projectId);
    return c.json({ status });
  } catch (e: unknown) {
    return c.json({ error: String(e) });
  }
});

gitRoutes.post('/commit', async (c) => {
  const body = await c.req.json<{ projectId: string; message: string }>();
  if (!body.message) return c.json({ error: 'message required' }, 400);
  try {
    const result = await gitCommit(body.projectId ?? 'default', body.message);
    return c.json({ ok: true, result });
  } catch (e: unknown) {
    return c.json({ error: String(e) }, 500);
  }
});

gitRoutes.get('/diff', async (c) => {
  const projectId = c.req.query('projectId') ?? 'default';
  try {
    const diff = await gitDiff(projectId);
    return c.json({ diff });
  } catch (e: unknown) {
    return c.json({ diff: '', error: String(e) });
  }
});
