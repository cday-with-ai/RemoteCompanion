import express from 'express';
import cors from 'cors';
import { chatRouter } from './routes/chat.js';
import { healthRouter } from './routes/health.js';
import { authMiddleware } from './auth/middleware.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);

app.use(authMiddleware);
app.use('/chat', chatRouter);

app.listen(PORT, HOST, () => {
  console.log(`ClaudeServer listening on ${HOST}:${PORT}`);
});
