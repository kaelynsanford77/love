import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import mime from 'mime-types';
import db from '../db';

const router = Router();

function getProjectPath(projectId: string): string {
  const project = db.prepare('SELECT path FROM projects WHERE id = ?').get(projectId) as any;
  if (!project) throw new Error('Project not found');
  return project.path;
}

function resolveSafePath(projectPath: string, filePath: string): string {
  const resolved = path.resolve(projectPath, filePath.replace(/^\//, ''));
  if (!resolved.startsWith(path.resolve(projectPath))) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

function buildTree(dir: string, projectPath: string): any {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const children: any[] = [];

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(projectPath, fullPath);

    if (entry.isDirectory()) {
      children.push({
        name: entry.name,
        path: relativePath,
        type: 'directory',
        children: buildTree(fullPath, projectPath),
      });
    } else {
      const ext = path.extname(entry.name).slice(1);
      const mimeType = mime.lookup(entry.name) || 'text/plain';
      children.push({
        name: entry.name,
        path: relativePath,
        type: 'file',
        ext,
        mimeType,
        size: fs.statSync(fullPath).size,
      });
    }
  }

  return children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// GET /api/fs/tree?projectId=&path=
router.get('/tree', (req, res) => {
  try {
    const { projectId, path: filePath = '' } = req.query as any;
    const projectPath = getProjectPath(projectId);
    const targetPath = filePath ? resolveSafePath(projectPath, filePath) : projectPath;
    const tree = buildTree(targetPath, projectPath);
    res.json({ tree, projectPath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fs/read?projectId=&path=
router.get('/read', (req, res) => {
  try {
    const { projectId, path: filePath } = req.query as any;
    if (!filePath) return res.status(400).json({ error: 'path is required' });
    const projectPath = getProjectPath(projectId);
    const fullPath = resolveSafePath(projectPath, filePath);

    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });

    const stat = fs.statSync(fullPath);
    const mimeType = mime.lookup(fullPath) || 'application/octet-stream';
    const isText = mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('typescript');

    if (isText) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      res.json({ content, mimeType, size: stat.size });
    } else {
      const content = fs.readFileSync(fullPath).toString('base64');
      res.json({ content, mimeType, size: stat.size, encoding: 'base64' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fs/write
router.post('/write', (req, res) => {
  try {
    const { projectId, path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: 'path is required' });
    const projectPath = getProjectPath(projectId);
    const fullPath = resolveSafePath(projectPath, filePath);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');

    db.prepare('UPDATE projects SET updated_at=? WHERE id=?').run(new Date().toISOString(), projectId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/fs/delete
router.delete('/delete', (req, res) => {
  try {
    const { projectId, path: filePath } = req.body;
    const projectPath = getProjectPath(projectId);
    const fullPath = resolveSafePath(projectPath, filePath);

    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Not found' });

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fs/mkdir
router.post('/mkdir', (req, res) => {
  try {
    const { projectId, path: dirPath } = req.body;
    const projectPath = getProjectPath(projectId);
    const fullPath = resolveSafePath(projectPath, dirPath);
    fs.mkdirSync(fullPath, { recursive: true });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fs/rename
router.post('/rename', (req, res) => {
  try {
    const { projectId, oldPath, newPath } = req.body;
    const projectPath = getProjectPath(projectId);
    const fullOld = resolveSafePath(projectPath, oldPath);
    const fullNew = resolveSafePath(projectPath, newPath);
    fs.mkdirSync(path.dirname(fullNew), { recursive: true });
    fs.renameSync(fullOld, fullNew);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fs/upload
const upload = multer({ dest: 'uploads/' });
router.post('/upload', upload.array('files'), (req, res) => {
  try {
    const { projectId, targetPath = 'public' } = req.body;
    const projectPath = getProjectPath(projectId);
    const destDir = resolveSafePath(projectPath, targetPath);
    fs.mkdirSync(destDir, { recursive: true });

    const files = (req.files as Express.Multer.File[]) || [];
    const saved = [];
    for (const file of files) {
      const dest = path.join(destDir, file.originalname);
      fs.copyFileSync(file.path, dest);
      fs.unlinkSync(file.path);
      saved.push({ name: file.originalname, path: path.relative(projectPath, dest) });
    }
    res.json({ files: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
