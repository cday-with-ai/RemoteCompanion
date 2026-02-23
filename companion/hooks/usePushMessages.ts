import { useEffect, useRef } from 'react';
import type { ConnectionMode } from '../types';
import { getServerConfig } from '../services/auth';
import { CompanionWebSocket, buildWsUrl } from '../services/websocket';

type AddPushedMessage = (content: string) => void;

export function usePushMessages(
  mode: ConnectionMode,
  addPushedMessage: AddPushedMessage,
): void {
  const wsRef = useRef<CompanionWebSocket | null>(null);
  const addRef = useRef(addPushedMessage);
  addRef.current = addPushedMessage;

  useEffect(() => {
    if (mode !== 'home') {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      const config = await getServerConfig();
      if (cancelled || !config) return;

      const wsUrl = buildWsUrl(config.url, config.apiKey || undefined);
      const ws = new CompanionWebSocket(wsUrl);
      wsRef.current = ws;

      ws.onMessage((data) => {
        const message = data['message'];
        if (typeof message === 'string' && message.length > 0) {
          const title = typeof data['title'] === 'string' ? data['title'] : undefined;
          const content = title ? `**${title}**\n\n${message}` : message;
          addRef.current(content);
        }
      });

      ws.connect();
    })();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [mode]);
}
