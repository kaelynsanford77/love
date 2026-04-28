import { Router } from 'express';
import db from '../db';
import {
  getGitLog,
  restoreToCommit,
  createBranchFromCommit,
  listBranches,
  checkoutBranch,
} from '../git/service';

const router = Router();

function getProjectPath(projectId: string): string {
  const project = db.prepare('SELECT path FROM projects WHERE id = ?').get(projectId) as any;
  if (!project) throw new Error('Project not found');
  return project.path;
}

// GET /api/git/log?projectId=
router.get('/log', async (req, res) => {
  try {
    const { projectId } = req.query as any;
    const projectPath = getProjectPath(projectId);
    const log = await getGitLog(projectPath);
    res.json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/git/restore
router.post('/restore', async (req, res) => {
  try {
    const { projectId, sha } = req.body;
    const projectPath = getProjectPath(projectId);
    await restoreToCommit(projectPath, sha);
    db.prepare('UPDATE projects SET git_sha=?, updated_at=? WHERE id=?').run(sha, new Date().toISOString(), projectId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/git/fork
router.post('/fork', async (req, res) => {
  try {
    const { projectId, sha, branchName } = req.body;
    const projectPath = getProjectPath(projectId);
    const name = branchName || `fork-${sha.slice(0, 7)}-${Date.now()}`;
    await createBranchFromCommit(projectPath, sha, name);
    res.json({ success: true, branchName: name });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/git/branches?projectId=
router.get('/branches', async (req, res) => {
  try {
    const { projectId } = req.query as any;
    const projectPath = getProjectPath(projectId);
    const branches = await listBranches(projectPath);
    res.json(branches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/git/checkout
router.post('/checkout', async (req, res) => {
  try {
    const { projectId, branch } = req.body;
    const projectPath = getProjectPath(projectId);
    await checkoutBranch(projectPath, branch);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
