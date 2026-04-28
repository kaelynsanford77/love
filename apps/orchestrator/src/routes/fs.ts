import { Hono } from 'hono';
import { upgradeWebSocket } from 'hono/bun';
import { watch } from 'chokidar';
import {
  viewFile,
  writeFile,
  buildTree,
  listFiles,
  getProjects,
  ensureProjectExists,
  getProjectRoot,
} from '../tools/view';

export const fsRoutes = new Hono();

// Get file tree
fsRoutes.get('/tree', async (c) => {
  const projectId = c.req.query('projectId') ?? 'default';
  try {
    const tree = await buildTree(projectId);
    return c.json({ tree });
  } catch (e: unknown) {
    return c.json({ error: String(e) }, 500);
  }
});

// Get file content
fsRoutes.get('/file', async (c) => {
  const projectId = c.req.query('projectId') ?? 'default';
  const filePath = c.req.query('path') ?? '';
  if (!filePath) return c.json({ error: 'path required' }, 400);
  try {
    const content = await viewFile(projectId, filePath);
    return c.json({ content, path: filePath });
  } catch (e: unknown) {
    return c.json({ error: String(e) }, 404);
  }
});

// Write file
fsRoutes.put('/file', async (c) => {
  const body = await c.req.json<{ projectId: string; path: string; content: string }>();
  if (!body.path) return c.json({ error: 'path required' }, 400);
  try {
    await writeFile(body.projectId ?? 'default', body.path, body.content ?? '');
    return c.json({ ok: true });
  } catch (e: unknown) {
    return c.json({ error: String(e) }, 500);
  }
});

// List projects
fsRoutes.get('/projects', async (c) => {
  const projects = await getProjects();
  return c.json({ projects });
});

// Create project
fsRoutes.post('/projects', async (c) => {
  const { name } = await c.req.json<{ name: string }>();
  if (!name) return c.json({ error: 'name required' }, 400);
  await ensureProjectExists(name);
  return c.json({ ok: true, name });
});

// WebSocket file watcher
fsRoutes.get(
  '/watch',
  upgradeWebSocket((c) => {
    const projectId = c.req.query('projectId') ?? 'default';
    let watcher: import('chokidar').FSWatcher | null = null;

    return {
      onOpen(_, ws) {
        getProjectRoot(projectId);
        ensureProjectExists(projectId).then((root) => {
          watcher = watch(root, {
            ignored: /(node_modules|\.git|dist|build)/,
            persistent: true,
            ignoreInitial: true,
          });

          const emit = (type: string, filePath: string) => {
            const rel = filePath.replace(root, '').replace(/^\//, '');
            ws.send(JSON.stringify({ type, path: rel }));
          };

          watcher.on('add', (p) => emit('add', p));
          watcher.on('change', (p) => emit('change', p));
          watcher.on('unlink', (p) => emit('unlink', p));
          watcher.on('addDir', (p) => emit('addDir', p));
          watcher.on('unlinkDir', (p) => emit('unlinkDir', p));
        });
      },
      onClose() {
        watcher?.close();
      },
    };
  })
);
