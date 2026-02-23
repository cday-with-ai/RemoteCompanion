import { useState, useCallback, useEffect, useRef } from 'react';
import type { Message, ConnectionMode, ChatMessage, Conversation } from '../types';
import { getClaudeApiKey, getModel, getServerConfig } from '../services/auth';
import { sendMessageLocal, sendMessageLocalNonStreaming } from '../services/claude-local';
import { sendMessageToServer, sendMessageToServerNonStreaming } from '../services/api';
import { extractAction } from '../services/actions';
import {
  saveConversation,
  loadConversation,
  getCurrentConversationId,
  setCurrentConversationId,
} from '../services/storage';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function titleFromFirstMessage(content: string): string {
  const trimmed = content.trim().slice(0, 50);
  return trimmed.length < content.trim().length ? trimmed + '...' : trimmed;
}

export function useChat(connectionMode: ConnectionMode) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  const connectionModeRef = useRef(connectionMode);
  connectionModeRef.current = connectionMode;

  // Synchronous update: keeps ref and state in lockstep so processNext
  // always reads the latest messages without waiting for a React render.
  const updateMessages = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      const next =
        typeof updater === 'function'
          ? updater(messagesRef.current)
          : updater;
      messagesRef.current = next;
      setMessages(next);
    },
    [],
  );

  // Load current conversation on mount
  useEffect(() => {
    (async () => {
      const id = await getCurrentConversationId();
      if (id) {
        const conv = await loadConversation(id);
        if (conv) {
          conversationIdRef.current = id;
          updateMessages(conv.messages);
        }
      }
    })();
  }, [updateMessages]);

  const persistConversation = useCallback(
    async (msgs: Message[]) => {
      if (msgs.length === 0) return;

      let id = conversationIdRef.current;
      if (!id) {
        id = generateId();
        conversationIdRef.current = id;
        await setCurrentConversationId(id);
      }

      const conv: Conversation = {
        id,
        title: titleFromFirstMessage(msgs[0].content),
        messages: msgs,
        createdAt: msgs[0].timestamp,
        updatedAt: Date.now(),
      };

      await saveConversation(conv);
    },
    [],
  );

  // Process the next queued user message. Calls itself recursively
  // via the ref so it always uses the latest closure.
  const processNextRef = useRef<() => Promise<void>>(async () => {});

  const processNext = useCallback(async () => {
    if (processingRef.current) return;

    const content = queueRef.current.shift();
    if (!content) return;

    processingRef.current = true;
    setIsStreaming(true);
    setError(null);

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      mode: connectionModeRef.current,
    };

    updateMessages((prev) => [...prev, assistantMessage]);

    // Build chat history from everything except the empty placeholder
    const chatHistory: ChatMessage[] = messagesRef.current
      .filter((m) => m.id !== assistantMessage.id)
      .map((m) => ({ role: m.role, content: m.content }));

    let fullResponse = '';

    const onChunk = (text: string) => {
      fullResponse += text;
      const updated = fullResponse;
      updateMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id ? { ...m, content: updated } : m,
        ),
      );
    };

    try {
      const mode = connectionModeRef.current;

      if (mode === 'home') {
        const config = await getServerConfig();
        if (!config) throw new Error('Server not configured');

        try {
          await sendMessageToServer(chatHistory, config, onChunk);
        } catch {
          fullResponse = await sendMessageToServerNonStreaming(
            chatHistory,
            config,
          );
          onChunk(fullResponse);
        }
      } else if (mode === 'local') {
        const apiKey = await getClaudeApiKey();
        if (!apiKey) throw new Error('Claude API key not configured');
        const model = await getModel();

        try {
          await sendMessageLocal(chatHistory, apiKey, model, onChunk);
        } catch {
          fullResponse = await sendMessageLocalNonStreaming(
            chatHistory,
            apiKey,
            model,
          );
          onChunk(fullResponse);
        }
      } else {
        throw new Error(
          'No connection available. Configure a server URL or Claude API key in Settings.',
        );
      }

      // Extract action tags from response
      const { content: cleanContent, action } = extractAction(fullResponse);

      updateMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: cleanContent, timestamp: Date.now(), action }
            : m,
        ),
      );
      setLastCompletedId(assistantMessage.id);
      await persistConversation(messagesRef.current);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      // Remove the failed assistant placeholder
      updateMessages((prev) =>
        prev.filter((m) => m.id !== assistantMessage.id),
      );
    } finally {
      processingRef.current = false;

      if (queueRef.current.length > 0) {
        processNextRef.current?.();
      } else {
        setIsStreaming(false);
      }
    }
  }, [updateMessages, persistConversation]);

  processNextRef.current = processNext;

  const addPushedMessage = useCallback(
    (content: string) => {
      const msg: Message = {
        id: generateId(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
        mode: 'home',
        source: 'push',
      };

      updateMessages((prev) => [...prev, msg]);
      persistConversation(messagesRef.current);
    },
    [persistConversation, updateMessages],
  );

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
        mode: connectionModeRef.current,
      };

      // Show user message immediately
      updateMessages((prev) => [...prev, userMessage]);

      // Queue for API processing
      queueRef.current.push(content.trim());
      processNextRef.current?.();
    },
    [updateMessages],
  );

  const clearChat = useCallback(async () => {
    updateMessages([]);
    setError(null);
    conversationIdRef.current = null;
    queueRef.current = [];
  }, [updateMessages]);

  return {
    messages,
    isStreaming,
    error,
    lastCompletedId,
    sendMessage,
    clearChat,
    addPushedMessage,
  };
}
