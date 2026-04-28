import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const WORKSPACES_ROOT = path.resolve(
  process.env.WORKSPACES_ROOT ?? path.join(process.cwd(), '../../workspaces')
);

export function getProjectRoot(projectId: string): string {
  // Sanitize: no path traversal
  const safe = projectId.replace(/[^a-zA-Z0-9_\-]/g, '_');
  return path.join(WORKSPACES_ROOT, safe);
}

export function resolveProjectPath(projectId: string, filePath: string): string {
  const root = getProjectRoot(projectId);
  const resolved = path.resolve(root, filePath.replace(/^\//, ''));
  // Ensure no traversal outside project root
  if (!resolved.startsWith(root)) {
    throw new Error(`Path traversal denied: ${filePath}`);
  }
  return resolved;
}

export async function ensureProjectExists(projectId: string): Promise<string> {
  const root = getProjectRoot(projectId);
  await fs.mkdir(root, { recursive: true });
  return root;
}

export async function viewFile(projectId: string, filePath: string): Promise<string> {
  const abs = resolveProjectPath(projectId, filePath);
  try {
    return await fs.readFile(abs, 'utf-8');
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }
}

export async function writeFile(
  projectId: string,
  filePath: string,
  content: string
): Promise<void> {
  const abs = resolveProjectPath(projectId, filePath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, 'utf-8');
}

export async function replaceLines(
  projectId: string,
  filePath: string,
  startLine: number,
  endLine: number,
  newContent: string
): Promise<void> {
  const abs = resolveProjectPath(projectId, filePath);
  const original = await fs.readFile(abs, 'utf-8');
  const lines = original.split('\n');
  lines.splice(startLine - 1, endLine - startLine + 1, ...newContent.split('\n'));
  await fs.writeFile(abs, lines.join('\n'), 'utf-8');
}

export async function listFiles(projectId: string, dirPath = '.'): Promise<string[]> {
  const abs = resolveProjectPath(projectId, dirPath);
  try {
    const entries = await fs.readdir(abs, { withFileTypes: true });
    return entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
  } catch {
    return [];
  }
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.cache',
  '__pycache__',
  '.venv',
  'venv',
]);

export async function buildTree(
  projectId: string,
  dirPath = '.',
  depth = 0
): Promise<FileNode[]> {
  if (depth > 6) return [];
  const abs = resolveProjectPath(projectId, dirPath);
  try {
    const entries = await fs.readdir(abs, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.env') continue;
      if (IGNORE_DIRS.has(entry.name)) continue;

      const relPath = path.join(dirPath === '.' ? '' : dirPath, entry.name).replace(/^\//, '');

      if (entry.isDirectory()) {
        const children = await buildTree(projectId, relPath, depth + 1);
        nodes.push({ name: entry.name, path: relPath, type: 'directory', children });
      } else {
        nodes.push({ name: entry.name, path: relPath, type: 'file' });
      }
    }

    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}

export async function getProjects(): Promise<string[]> {
  try {
    await fs.mkdir(WORKSPACES_ROOT, { recursive: true });
    const entries = await fs.readdir(WORKSPACES_ROOT, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}
