import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import { initDb } from './db';
import projectsRouter from './routes/projects';
import fsRouter from './routes/fs';
import gitRouter from './routes/git';
import chatRouter from './routes/chat';
import execRouter from './routes/exec';
import previewRouter from './routes/preview';
import npmRouter from './routes/npm';
import githubRouter from './routes/github';
import supabaseRouter from './routes/supabase';
import usageRouter from './routes/usage';
import { setupTerminalWs } from './routes/terminal';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// ─── Simple in-memory rate limiter ────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests, please slow down' });
    }
    next();
  };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((v, k) => { if (now > v.resetAt) rateLimitMap.delete(k); });
}, 60_000);

// CORS
app.use(cors({
  origin: process.env.WEB_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploads
const projectsDir = process.env.PROJECTS_DIR || path.join(process.cwd(), 'projects');
app.use('/uploads', express.static(projectsDir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/projects', rateLimit(60, 60_000), projectsRouter);
app.use('/api/fs', rateLimit(120, 60_000), fsRouter);
app.use('/api/git', rateLimit(60, 60_000), gitRouter);
app.use('/api/chat', rateLimit(20, 60_000), chatRouter);
app.use('/api/exec', rateLimit(30, 60_000), execRouter);
app.use('/api/preview', rateLimit(20, 60_000), previewRouter);
app.use('/api/npm', rateLimit(30, 60_000), npmRouter);
app.use('/api/github', rateLimit(10, 60_000), githubRouter);
app.use('/api/supabase', rateLimit(20, 60_000), supabaseRouter);
app.use('/api/usage', rateLimit(30, 60_000), usageRouter);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// HTTP + WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/terminal' });
setupTerminalWs(wss);

// Init DB then start
initDb();

server.listen(PORT, () => {
  console.log(`🚀 Orchestrator running on http://localhost:${PORT}`);
});

export default app;
