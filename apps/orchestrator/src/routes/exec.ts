import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import db from '../db';

const execAsync = promisify(exec);
const router = Router();

// POST /api/exec
router.post('/', async (req, res) => {
  try {
    const { projectId, command } = req.body;
    if (!projectId || !command) return res.status(400).json({ error: 'projectId and command required' });

    const project = db.prepare('SELECT path FROM projects WHERE id = ?').get(projectId) as any;
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { stdout, stderr } = await execAsync(command, {
      cwd: project.path,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    res.json({ stdout, stderr, exitCode: 0 });
  } catch (err: any) {
    res.json({
      stdout: err.stdout || '',
      stderr: err.stderr || err.message,
      exitCode: err.code || 1,
    });
  }
});

export default router;
