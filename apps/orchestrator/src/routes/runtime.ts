import { Hono } from 'hono';

export const runtimeRoutes = new Hono();

const runtimeStatus = { status: 'running', pid: process.pid };

runtimeRoutes.get('/status', (c) => c.json(runtimeStatus));

runtimeRoutes.post('/restart', (c) => {
  runtimeStatus.status = 'running';
  return c.json({ ok: true, message: 'Runtime restarted' });
});
