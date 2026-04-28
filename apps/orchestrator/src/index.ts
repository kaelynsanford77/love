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
app.use('/api/projects', projectsRouter);
app.use('/api/fs', fsRouter);
app.use('/api/git', gitRouter);
app.use('/api/chat', chatRouter);
app.use('/api/exec', execRouter);
app.use('/api/preview', previewRouter);
app.use('/api/npm', npmRouter);
app.use('/api/github', githubRouter);
app.use('/api/supabase', supabaseRouter);
app.use('/api/usage', usageRouter);

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
