import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/summary', (_req, res) => {
  const totals = db.prepare(`
    SELECT
      tier,
      model,
      COUNT(*) as turns,
      SUM(tokens_in) as total_tokens_in,
      SUM(tokens_out) as total_tokens_out,
      SUM(cost_usd) as total_cost_usd,
      AVG(duration_ms) as avg_duration_ms
    FROM chat_turns
    WHERE role = 'assistant'
    GROUP BY tier, model
    ORDER BY tier
  `).all();

  const recent = db.prepare(`
    SELECT id, session_id, model, tier, tokens_in, tokens_out, cost_usd, duration_ms, escalated_from, created_at
    FROM chat_turns
    WHERE role = 'assistant'
    ORDER BY created_at DESC
    LIMIT 50
  `).all();

  res.json({ totals, recent });
});

export default router;
