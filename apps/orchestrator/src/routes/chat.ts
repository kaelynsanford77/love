import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { route } from '../llm/router.js';
import type { ChatMessage } from '../llm/provider.js';
import { z } from 'zod';

const router = Router();

const ChatRequestSchema = z.object({
  session_id: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    }),
  ),
  system_prompt: z.string().optional(),
  previous_failed: z.boolean().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = ChatRequestSchema.parse(req.body);
    const session_id = body.session_id ?? uuidv4();
    const messages = body.messages as ChatMessage[];

    const conversationLength = db
      .prepare('SELECT COUNT(*) as cnt FROM chat_turns WHERE session_id = ?')
      .get(session_id) as { cnt: number };

    const result = await route(
      messages,
      conversationLength.cnt,
      body.system_prompt,
      body.previous_failed,
    );

    const turn_id = uuidv4();
    db.prepare(`
      INSERT INTO chat_turns (id, session_id, role, content, model, tier, tokens_in, tokens_out, cost_usd, duration_ms, escalated_from)
      VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      turn_id,
      session_id,
      result.content,
      result.model,
      result.tier,
      result.tokens_in,
      result.tokens_out,
      result.cost_usd,
      result.duration_ms,
      result.escalated_from ?? null,
    );

    res.json({ session_id, turn_id, ...result });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router;
