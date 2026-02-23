type MessageHandler = (data: Record<string, unknown>) => void;

const MIN_RECONNECT_DELAY = 1_000;
const MAX_RECONNECT_DELAY = 30_000;

export class CompanionWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers = new Set<MessageHandler>();
  private reconnectDelay = MIN_RECONNECT_DELAY;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    this.closed = false;
    this.doConnect();
  }

  private doConnect(): void {
    if (this.closed) return;

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = MIN_RECONNECT_DELAY;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as Record<string, unknown>;
        for (const handler of this.handlers) {
          handler(data);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror
    };
  }

  private scheduleReconnect(): void {
    if (this.closed) return;
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
      this.doConnect();
    }, this.reconnectDelay);
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  close(): void {
    this.closed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }
}

export function buildWsUrl(httpUrl: string, token?: string): string {
  const url = httpUrl.replace(/\/$/, '');
  const wsBase = url.replace(/^http/, 'ws');
  const wsUrl = `${wsBase}/ws`;
  return token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;
}
