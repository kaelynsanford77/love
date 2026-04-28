import { Hono } from 'hono';

export const dbRoutes = new Hono();

dbRoutes.get('/tables', (c) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return c.json({ tables: [], note: 'No DATABASE_URL configured' });
  return c.json({ tables: [] });
});

dbRoutes.post('/query', async (c) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return c.json({ rows: [], error: 'No DATABASE_URL configured' }, 503);
  const { sql, params } = await c.req.json();
  return c.json({ rows: [], sql, params });
});
