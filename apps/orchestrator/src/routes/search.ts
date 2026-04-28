import { Hono } from 'hono';
import { getProjectRoot } from '../tools/view.js';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

export const searchRoutes = new Hono();

searchRoutes.get('/', async (c) => {
  const projectId = c.req.query('projectId') ?? 'default';
  const query = c.req.query('q') ?? '';
  const ext = c.req.query('ext');

  if (!query) return c.json({ results: [] });

  try {
    const root = getProjectRoot(projectId);
    const results: Array<{ file: string; line: number; text: string }> = [];

    await searchDir(root, root, query, ext ?? null, results);
    return c.json({ results: results.slice(0, 100) });
  } catch (e: unknown) {
    return c.json({ results: [], error: String(e) });
  }
});

async function searchDir(
  root: string,
  dir: string,
  query: string,
  ext: string | null,
  results: Array<{ file: string; line: number; text: string }>
) {
  const IGNORE = new Set(['node_modules', '.git', 'dist', 'build', '.next']);
  let entries: { name: string; isDirectory: () => boolean }[];
  try {
    entries = (await readdir(dir, { withFileTypes: true })) as unknown as {
      name: string;
      isDirectory: () => boolean;
    }[];
  } catch {
    return;
  }

  for (const entry of entries) {
    if (IGNORE.has(entry.name)) continue;
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await searchDir(root, full, query, ext, results);
    } else {
      if (ext && !entry.name.endsWith(ext)) continue;
      try {
        const content = await readFile(full, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              file: full.replace(root + '/', ''),
              line: i + 1,
              text: line.trim().slice(0, 200),
            });
          }
        });
      } catch {
        // binary file or read error, skip
      }
    }
  }
}
