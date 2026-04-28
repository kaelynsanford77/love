import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { chatRoutes } from './routes/chat';
import { fsRoutes } from './routes/fs';
import { execRoutes } from './routes/exec';
import { gitRoutes } from './routes/git';
import { searchRoutes } from './routes/search';
import { classifyRoutes } from './routes/classify';
import { previewRoutes } from './routes/preview';
import { projectsRoutes } from './routes/projects';
import { runtimeRoutes } from './routes/runtime';
import { dbRoutes } from './routes/db';
import { publishRoutes } from './routes/publish';
import { githubRoutes } from './routes/github';
import { supabaseRoutes } from './routes/supabase';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', '*'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// Optional bearer token auth
const BEARER_TOKEN = process.env.BEARER_TOKEN;
app.use('/chat/*', async (c, next) => {
  if (BEARER_TOKEN) {
    const auth = c.req.header('Authorization') ?? '';
    const token = c.req.query('token');
    if (auth !== `Bearer ${BEARER_TOKEN}` && token !== BEARER_TOKEN) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }
  return next();
});

// Health checks
app.get('/', (c) => c.json({ ok: true, service: 'lovable-solo-orchestrator', ts: Date.now() }));
app.get('/health', (c) => c.json({ ok: true, uptime: process.uptime(), ts: Date.now() }));
app.get('/healthz', (c) => c.json({ ok: true, uptime: process.uptime(), ts: Date.now() }));

// Routes
app.route('/chat', chatRoutes);
app.route('/fs', fsRoutes);
app.route('/exec', execRoutes);
app.route('/git', gitRoutes);
app.route('/search', searchRoutes);
app.route('/classify', classifyRoutes);
app.route('/preview', previewRoutes);
app.route('/projects', projectsRoutes);
app.route('/runtime', runtimeRoutes);
app.route('/db', dbRoutes);
app.route('/publish', publishRoutes);
app.route('/github', githubRoutes);
app.route('/supabase', supabaseRoutes);

// Analytics stub
app.get('/analytics', (c) => c.json({ message: 'Analytics not configured', tables: [], stats: {} }));

// Cloud/DB stubs
app.get('/cloud/tables', (c) => c.json({ tables: [] }));
app.post('/cloud/sql', (c) => c.json({ rows: [], error: 'No database configured' }));

const port = parseInt(process.env.ORCHESTRATOR_PORT ?? process.env.PORT ?? '4000', 10);
console.log(`🚀 Orchestrator running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
