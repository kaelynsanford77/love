import { Router } from 'express';
import db from '../db';

const router = Router();

// POST /api/supabase/connect
router.post('/connect', async (req, res) => {
  try {
    const { projectId, supabaseUrl, supabaseKey } = req.body;
    if (!projectId || !supabaseUrl || !supabaseKey) {
      return res.status(400).json({ error: 'projectId, supabaseUrl, and supabaseKey are required' });
    }

    // Test connection
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to connect to Supabase. Check your credentials.' });
    }

    db.prepare('UPDATE projects SET supabase_url=?, supabase_key=?, updated_at=? WHERE id=?')
      .run(supabaseUrl, supabaseKey, new Date().toISOString(), projectId);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/supabase/tables?projectId=
router.get('/tables', async (req, res) => {
  try {
    const { projectId } = req.query as any;
    const project = db.prepare('SELECT supabase_url, supabase_key FROM projects WHERE id=?').get(projectId) as any;

    if (!project?.supabase_url || !project?.supabase_key) {
      return res.status(400).json({ error: 'Supabase not configured for this project' });
    }

    const response = await fetch(`${project.supabase_url}/rest/v1/?select=*`, {
      headers: {
        'apikey': project.supabase_key,
        'Authorization': `Bearer ${project.supabase_key}`,
      },
    });

    const data = await response.json() as any;
    const tables = Object.keys(data.definitions || {});
    res.json({ tables });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
