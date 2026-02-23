import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { chatRouter } from './routes/chat.js';
import { healthRouter } from './routes/health.js';
import { pushRouter } from './routes/push.js';
import { authMiddleware } from './auth/middleware.js';
import { attachWebSocket } from './ws/handler.js';

// Global safety nets — prevent uncaught errors from crashing the process
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);

app.use(authMiddleware);
app.use('/chat', chatRouter);
app.use('/push', pushRouter);

const server = createServer(app);
attachWebSocket(server);

server.listen(PORT, HOST, () => {
  console.log(`ClaudeServer listening on ${HOST}:${PORT}`);
});
