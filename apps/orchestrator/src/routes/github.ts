import { type IRouter, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import db from '../db';
import { initGitRepo } from '../git/service';
import simpleGit from 'simple-git';

const router: IRouter = Router();
const PROJECTS_DIR = process.env.PROJECTS_DIR || path.join(process.cwd(), 'projects');

// POST /api/github/import
router.post('/import', async (req, res) => {
  try {
    const { repoUrl, name } = req.body;
    if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

    const projectName = name || repoUrl.split('/').pop()?.replace('.git', '') || 'imported-project';
    const id = uuidv4();
    const projectPath = path.join(PROJECTS_DIR, id);
    fs.mkdirSync(projectPath, { recursive: true });

    // Validate URL is a proper GitHub URL before injecting token
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(repoUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid repository URL' });
    }

    if (parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ error: 'Only HTTPS URLs are allowed' });
    }

    const allowedHosts = ['github.com', 'gitlab.com', 'bitbucket.org'];
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      return res.status(400).json({ error: `Host not allowed. Permitted: ${allowedHosts.join(', ')}` });
    }

    // Clone the repo
    const token = process.env.GITHUB_TOKEN;
    let cloneUrl = repoUrl;
    if (token && parsedUrl.hostname === 'github.com') {
      cloneUrl = `https://${token}@${parsedUrl.hostname}${parsedUrl.pathname}`;
    }

    const git = simpleGit();
    await git.clone(cloneUrl, projectPath);

    const projectGit = simpleGit(projectPath);
    const log = await projectGit.log({ maxCount: 1 });
    const sha = log.latest?.hash || '';

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO projects (id, name, path, description, created_at, updated_at, git_sha, github_repo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, projectName, projectPath, `Imported from ${repoUrl}`, now, now, sha, repoUrl);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.status(201).json(project);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
