import 'dotenv/config';
import path from 'path';
import fs from 'fs/promises';
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
import { simpleGit } from 'simple-git';

const WORKSPACES = path.resolve(process.env.WORKSPACES_ROOT ?? './workspaces');

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

// Health check
app.get('/', (c) => c.json({ ok: true, service: 'lovable-solo-orchestrator', ts: Date.now() }));
app.get('/health', (c) => c.json({ ok: true }));

// Routes
app.route('/chat', chatRoutes);
app.route('/fs', fsRoutes);
app.route('/exec', execRoutes);
app.route('/git', gitRoutes);
app.route('/search', searchRoutes);
app.route('/classify', classifyRoutes);
app.route('/preview', previewRoutes);

// Analytics stub
app.get('/analytics', (c) => c.json({ message: 'Analytics not configured', tables: [], stats: {} }));

// Cloud/DB stubs
app.get('/cloud/tables', (c) => c.json({ tables: [] }));
app.post('/cloud/sql', (c) => c.json({ rows: [], error: 'No database configured' }));

// Health alias
app.get('/healthz', (c) =>
  c.json({ ok: true, uptime: process.uptime(), ts: Date.now() })
);

// Projects
app.get('/projects', async (c) => {
  try {
    const entries = await fs.readdir(WORKSPACES, { withFileTypes: true });
    const projects = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    return c.json({ projects });
  } catch {
    return c.json({ projects: ['default'] });
  }
});

app.post('/projects/switch', async (c) => {
  const { projectId } = await c.req.json();
  return c.json({ ok: true, projectId });
});

app.post('/projects/create', async (c) => {
  const { name } = await c.req.json();
  const projectPath = path.join(WORKSPACES, name);
  await fs.mkdir(projectPath, { recursive: true });
  await fs.writeFile(
    path.join(projectPath, 'README.md'),
    `# ${name}\n\nCreated with Lovable Solo.\n`
  );
  const git = simpleGit(projectPath);
  await git.init();
  await git.add('.');
  await git.commit('Initial commit');
  return c.json({ ok: true, projectId: name });
});

// Runtime
const runtimeStatus = { status: 'running', pid: process.pid };

app.get('/runtime/status', (c) => c.json(runtimeStatus));

app.post('/runtime/restart', (c) => {
  runtimeStatus.status = 'running';
  return c.json({ ok: true, message: 'Runtime restarted' });
});

// DB introspection stubs (wired to cloud/db config when available)
app.get('/db/tables', (c) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return c.json({ tables: [], note: 'No DATABASE_URL configured' });
  return c.json({ tables: [] });
});

app.post('/db/query', async (c) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return c.json({ rows: [], error: 'No DATABASE_URL configured' }, 503);
  const { sql, params } = await c.req.json();
  // Passthrough stub — a real implementation would use a pg client here
  return c.json({ rows: [], sql, params });
});

// Publish / deploy trigger
app.post('/publish', async (c) => {
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

const port = parseInt(process.env.ORCHESTRATOR_PORT ?? process.env.PORT ?? '4000', 10);
console.log(`🚀 Orchestrator running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
