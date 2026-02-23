import { Router } from 'express';
import { streamChatResponse, chatResponse } from '../claude/client.js';
import type { ChatMessage } from '../claude/client.js';

export const chatRouter = Router();

chatRouter.post('/', async (req, res) => {
  const { messages, stream = true } = req.body as {
    messages?: ChatMessage[];
    stream?: boolean;
  };

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages array required' });
    return;
  }

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      await streamChatResponse(messages, (chunk) => {
        // Send raw text chunks as SSE data events
        res.write(`data: ${JSON.stringify({ type: 'text', text: chunk })}\n\n`);
      });

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const response = await chatResponse(messages);
      res.json({ response });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Chat error:', message);

    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.end();
    }
  }
});
