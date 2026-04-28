import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { runAgent } from '../llm/agent';

const router = Router();

// POST /api/chat
router.post('/', async (req: Request, res: Response) => {
  const { projectId, message, attachments = [], model: preferredModel } = req.body;

  if (!projectId || !message) {
    return res.status(400).json({ error: 'projectId and message are required' });
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
  if (!project) return res.status(404).json({ error: 'Project not found' });

  // Setup SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Save user turn
  const userTurnId = uuidv4();
  const turnIndex = (db.prepare('SELECT COUNT(*) as c FROM chat_turns WHERE project_id=?').get(projectId) as any).c;
  db.prepare(`
    INSERT INTO chat_turns (id, project_id, role, content, created_at, attachments, turn_index)
    VALUES (?, ?, 'user', ?, ?, ?, ?)
  `).run(userTurnId, projectId, message, new Date().toISOString(), JSON.stringify(attachments), turnIndex);

  // Get chat history
  const history = db.prepare(`
    SELECT role, content FROM chat_turns
    WHERE project_id=? ORDER BY turn_index ASC
    LIMIT 50
  `).all(projectId) as Array<{ role: string; content: string }>;

  try {
    const result = await runAgent({
      projectPath: project.path,
      projectId,
      messages: history,
      sendEvent,
      preferredModel,
    });

    // Save assistant turn
    const assistantTurnId = uuidv4();
    db.prepare(`
      INSERT INTO chat_turns (id, project_id, role, content, model, tokens_in, tokens_out, cost_usd, git_sha, created_at, turn_index)
      VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      assistantTurnId,
      projectId,
      result.content,
      result.model,
      result.tokensIn,
      result.tokensOut,
      result.costUsd,
      result.gitSha,
      new Date().toISOString(),
      turnIndex + 1,
    );

    // Update project git sha
    if (result.gitSha) {
      db.prepare('UPDATE projects SET git_sha=?, updated_at=? WHERE id=?').run(
        result.gitSha, new Date().toISOString(), projectId
      );
    }

    sendEvent('done', { turnId: assistantTurnId, model: result.model, tokensIn: result.tokensIn, tokensOut: result.tokensOut, costUsd: result.costUsd });
  } catch (err: any) {
    sendEvent('error', { message: err.message });
  } finally {
    res.end();
  }
});

// GET /api/chat/history/:projectId
router.get('/history/:projectId', (req, res) => {
  try {
    const turns = db.prepare(`
      SELECT * FROM chat_turns WHERE project_id=? ORDER BY turn_index ASC
    `).all(req.params.projectId);
    res.json(turns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/history/:projectId
router.delete('/history/:projectId', (req, res) => {
  try {
    db.prepare('DELETE FROM chat_turns WHERE project_id=?').run(req.params.projectId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
