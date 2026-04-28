import { Hono } from 'hono';
import { getProjectRoot } from '../tools/view';
import { serveStatic } from 'hono/bun';
import path from 'path';
import fs from 'fs/promises';

export const previewRoutes = new Hono();

// Serve project files for preview
previewRoutes.get('/:projectId/*', async (c) => {
  const projectId = c.req.param('projectId');
  const filePath = c.req.path.replace(`/preview/${projectId}`, '') || '/index.html';

  try {
    const root = getProjectRoot(projectId);
    // Look in dist/ first (built project), then root
    const candidates = [
      path.join(root, 'dist', filePath),
      path.join(root, filePath.replace(/^\//, '')),
      path.join(root, 'dist', 'index.html'),
      path.join(root, 'index.html'),
    ];

    for (const candidate of candidates) {
      try {
        const content = await fs.readFile(candidate);
        const ext = path.extname(candidate).slice(1);
        const mimeMap: Record<string, string> = {
          html: 'text/html',
          css: 'text/css',
          js: 'application/javascript',
          json: 'application/json',
          svg: 'image/svg+xml',
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          ico: 'image/x-icon',
          woff2: 'font/woff2',
          woff: 'font/woff',
          ttf: 'font/ttf',
          map: 'application/json',
        };
        const mime = mimeMap[ext] ?? 'application/octet-stream';
        return new Response(content, {
          headers: { 'Content-Type': mime },
        });
      } catch {
        continue;
      }
    }

    // Return a placeholder page if project has no build
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Preview – ${projectId}</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #94a3b8; }
    .card { text-align: center; padding: 2rem; border: 1px solid #1e293b; border-radius: 12px; }
    h1 { color: #e2e8f0; font-size: 1.5rem; margin-bottom: 0.5rem; }
    code { background: #1e293b; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📂 ${projectId}</h1>
    <p>No built files found. Ask the AI to create your project.</p>
    <p>Then run <code>npm run build</code> in the terminal.</p>
  </div>
</body>
</html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (e: unknown) {
    return c.json({ error: String(e) }, 500);
  }
});
