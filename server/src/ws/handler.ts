import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import type { IncomingMessage } from 'node:http';

const HEARTBEAT_INTERVAL = 30_000;

const clients = new Set<WebSocket>();

let wss: WebSocketServer | null = null;

export function attachWebSocket(server: Server): void {
  wss = new WebSocketServer({ noServer: true });

  wss.on('error', (err) => {
    console.error('WebSocketServer error:', err.message);
  });

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    socket.on('error', (err) => {
      console.error('Upgrade socket error:', err.message);
    });

    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    // Auth: check token query param if CLAUDE_SERVER_API_KEY is set
    const apiKey = process.env['CLAUDE_SERVER_API_KEY'];
    if (apiKey) {
      const token = url.searchParams.get('token');
      if (token !== apiKey) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
    }

    wss!.handleUpgrade(req, socket, head, (ws) => {
      wss!.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    (ws as any).isAlive = true;

    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err.message);
      clients.delete(ws);
    });
  });

  // Heartbeat: ping every 30s, terminate dead connections
  const interval = setInterval(() => {
    for (const ws of clients) {
      if (!(ws as any).isAlive) {
        clients.delete(ws);
        ws.terminate();
        continue;
      }
      (ws as any).isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  wss.on('close', () => {
    clearInterval(interval);
  });
}

export function broadcast(data: Record<string, unknown>): void {
  const payload = JSON.stringify(data);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}
