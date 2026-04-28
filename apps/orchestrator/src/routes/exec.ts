import { type IRouter, Router } from 'express';
import { spawn } from 'child_process';
import db from '../db';

const router: IRouter = Router();

// Strict allowlist of permitted binary names (first token of command)
const ALLOWED_BINARIES = new Set([
  'bun', 'npm', 'npx', 'node', 'tsc', 'vite',
  'git', 'ls', 'cat', 'echo', 'pwd', 'find',
  'bunx', 'wrangler', 'netlify', 'vercel',
]);

function isCommandAllowed(parts: string[]): boolean {
  if (parts.length === 0) return false;
  const bin = parts[0];
  if (!ALLOWED_BINARIES.has(bin)) return false;
  // Reject any argument that looks like a shell metacharacter injection
  return parts.every(p => !/[;&|`$<>()\n\r]/.test(p));
}

// POST /api/exec
router.post('/', async (req, res) => {
  try {
    const { projectId, command } = req.body;
    if (!projectId || !command) return res.status(400).json({ error: 'projectId and command required' });

    const parts: string[] = String(command).trim().split(/\s+/);
    if (!isCommandAllowed(parts)) {
      return res.status(400).json({ error: 'Command not allowed. Use bun/npm/npx/node/git/tsc commands.' });
    }

    const project = db.prepare('SELECT path FROM projects WHERE id = ?').get(projectId) as any;
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [cmd, ...args] = parts;

    await new Promise<void>((resolve) => {
      const proc = spawn(cmd, args, {
        cwd: project.path,
        timeout: 30000,
        shell: false,
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() });
      proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() });

      proc.on('close', (exitCode) => {
        res.json({ stdout, stderr, exitCode: exitCode ?? 0 });
        resolve();
      });

      proc.on('error', (err) => {
        res.json({ stdout: '', stderr: err.message, exitCode: 1 });
        resolve();
      });
    });
  } catch (err: any) {
    res.json({
      stdout: '',
      stderr: err.message,
      exitCode: 1,
    });
  }
});

export default router;
