import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import db from '../db';
import { createProjectScaffold } from '../projects/scaffold';
import { initGitRepo } from '../git/service';

const router = Router();
const PROJECTS_DIR = process.env.PROJECTS_DIR || path.join(process.cwd(), 'projects');

// Ensure projects dir exists
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// GET /api/projects
router.get('/', (_req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  try {
    const { name, description, template = 'react-ts' } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const id = uuidv4();
    const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const projectPath = path.join(PROJECTS_DIR, id);

    fs.mkdirSync(projectPath, { recursive: true });

    // Create scaffold
    await createProjectScaffold(projectPath, { name, description, template });

    // Init git
    const sha = await initGitRepo(projectPath, `Initial commit: ${name}`);

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO projects (id, name, path, description, created_at, updated_at, git_sha)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, projectPath, description || '', now, now, sha);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.status(201).json(project);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id
router.patch('/:id', (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
    if (!project) return res.status(404).json({ error: 'Not found' });

    const { name, description, supabase_url, supabase_key, github_repo } = req.body;
    const updated = {
      name: name ?? project.name,
      description: description ?? project.description,
      supabase_url: supabase_url ?? project.supabase_url,
      supabase_key: supabase_key ?? project.supabase_key,
      github_repo: github_repo ?? project.github_repo,
      updated_at: new Date().toISOString(),
    };

    db.prepare(`
      UPDATE projects SET name=?, description=?, supabase_url=?, supabase_key=?, github_repo=?, updated_at=?
      WHERE id=?
    `).run(updated.name, updated.description, updated.supabase_url, updated.supabase_key, updated.github_repo, updated.updated_at, req.params.id);

    res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
    if (!project) return res.status(404).json({ error: 'Not found' });

    // Remove project directory
    if (fs.existsSync(project.path)) {
      fs.rmSync(project.path, { recursive: true, force: true });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
