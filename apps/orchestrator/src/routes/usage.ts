import { Router } from 'express';
import db from '../db';

const router = Router();

// GET /api/usage?projectId=
router.get('/', (req, res) => {
  try {
    const { projectId } = req.query as any;

    if (projectId) {
      const stats = db.prepare(`
        SELECT
          COUNT(*) as turn_count,
          SUM(tokens_in) as total_tokens_in,
          SUM(tokens_out) as total_tokens_out,
          SUM(cost_usd) as total_cost_usd,
          model,
          COUNT(*) as model_turns
        FROM chat_turns
        WHERE project_id=? AND role='assistant'
        GROUP BY model
      `).all(projectId);

      const totals = db.prepare(`
        SELECT
          COUNT(*) as turn_count,
          SUM(tokens_in) as total_tokens_in,
          SUM(tokens_out) as total_tokens_out,
          SUM(cost_usd) as total_cost_usd
        FROM chat_turns
        WHERE project_id=? AND role='assistant'
      `).get(projectId);

      const timeline = db.prepare(`
        SELECT
          date(created_at) as date,
          SUM(cost_usd) as daily_cost,
          SUM(tokens_in + tokens_out) as daily_tokens
        FROM chat_turns
        WHERE project_id=? AND role='assistant'
        GROUP BY date(created_at)
        ORDER BY date ASC
        LIMIT 30
      `).all(projectId);

      res.json({ byModel: stats, totals, timeline });
    } else {
      // Global usage
      const stats = db.prepare(`
        SELECT
          p.name as project_name,
          p.id as project_id,
          COUNT(c.id) as turn_count,
          SUM(c.tokens_in) as total_tokens_in,
          SUM(c.tokens_out) as total_tokens_out,
          SUM(c.cost_usd) as total_cost_usd
        FROM projects p
        LEFT JOIN chat_turns c ON c.project_id = p.id AND c.role='assistant'
        GROUP BY p.id
        ORDER BY total_cost_usd DESC
      `).all();

      res.json({ byProject: stats });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
