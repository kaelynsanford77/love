import { Router } from 'express';
import { spawn } from 'child_process';
import db from '../db';

const router = Router();

// Allowlist of permitted command prefixes for the exec endpoint
const ALLOWED_COMMAND_PREFIXES = [
  'bun ', 'npm ', 'npx ', 'node ', 'tsc', 'vite',
  'git ', 'ls', 'cat ', 'echo ', 'pwd', 'find ',
];

function isCommandAllowed(command: string): boolean {
  const trimmed = command.trim();
  return ALLOWED_COMMAND_PREFIXES.some(prefix => trimmed.startsWith(prefix));
}

// POST /api/exec
router.post('/', async (req, res) => {
  try {
    const { projectId, command } = req.body;
    if (!projectId || !command) return res.status(400).json({ error: 'projectId and command required' });

    if (!isCommandAllowed(command)) {
      return res.status(400).json({ error: 'Command not allowed. Use bun/npm/npx/node/git/tsc commands.' });
    }

    const project = db.prepare('SELECT path FROM projects WHERE id = ?').get(projectId) as any;
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Use spawn with shell: false by splitting the command
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

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
