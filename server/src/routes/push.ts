import { Router } from 'express';
import { broadcast, getClientCount } from '../ws/handler.js';

export const pushRouter = Router();

interface PushBody {
  message: string;
  title?: string;
  type?: string;
}

pushRouter.post('/', (req, res) => {
  const { message, title, type } = req.body as PushBody;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const payload = {
    type: type ?? 'push',
    message,
    title: title ?? undefined,
    timestamp: Date.now(),
  };

  broadcast(payload);

  res.json({ ok: true, clients: getClientCount() });
});
