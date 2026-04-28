import { Hono } from 'hono';

export const publishRoutes = new Hono();

publishRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const projectId: string = body.projectId ?? 'default';
  return c.json({
    ok: true,
    message: 'Build triggered',
    url: `http://localhost:3000/preview/${projectId}`,
    status: 'building',
    projectId,
  });
});
