import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import chatRouter from './routes/chat.js';
import telemetryRouter from './routes/telemetry.js';
import projectsRouter from './routes/projects.js';
import githubRouter from './routes/github.js';
import supabaseRouter from './routes/supabase.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: '4mb' }));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));
app.use('/chat', chatLimiter, chatRouter);
app.use('/telemetry', telemetryLimiter, telemetryRouter);
app.use('/projects', apiLimiter, projectsRouter);
app.use('/github', apiLimiter, githubRouter);
app.use('/supabase', apiLimiter, supabaseRouter);

app.listen(PORT, () => {
  console.log(`Orchestrator running on http://localhost:${PORT}`);
});
