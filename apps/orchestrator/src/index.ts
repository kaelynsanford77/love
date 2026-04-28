import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import telemetryRouter from './routes/telemetry.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: '4mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/chat', chatRouter);
app.use('/telemetry', telemetryRouter);

app.listen(PORT, () => {
  console.log(`Orchestrator running on http://localhost:${PORT}`);
});
