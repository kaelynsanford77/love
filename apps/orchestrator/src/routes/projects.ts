import { Hono } from 'hono';
import path from 'path';
import fs from 'fs/promises';
import { simpleGit } from 'simple-git';

const WORKSPACES = path.resolve(process.env.WORKSPACES_ROOT ?? './workspaces');

export const projectsRoutes = new Hono();

projectsRoutes.get('/', async (c) => {
  try {
    const entries = await fs.readdir(WORKSPACES, { withFileTypes: true });
    const projects = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    return c.json({ projects });
  } catch {
    return c.json({ projects: ['default'] });
  }
});

projectsRoutes.post('/switch', async (c) => {
  const { projectId } = await c.req.json();
  return c.json({ ok: true, projectId });
});

projectsRoutes.post('/create', async (c) => {
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
