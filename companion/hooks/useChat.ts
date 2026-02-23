import { useState, useCallback, useEffect, useRef } from 'react';
import type { Message, ConnectionMode, ChatMessage, Conversation } from '../types';
import { getClaudeApiKey, getModel, getServerConfig } from '../services/auth';
import { sendMessageLocal, sendMessageLocalNonStreaming } from '../services/claude-local';
import { sendMessageToServer, sendMessageToServerNonStreaming } from '../services/api';
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
  const conversationIdRef = useRef<string | null>(null);

  // Load current conversation on mount
  useEffect(() => {
    (async () => {
      const id = await getCurrentConversationId();
      if (id) {
        const conv = await loadConversation(id);
        if (conv) {
          conversationIdRef.current = id;
          setMessages(conv.messages);
        }
      }
    })();
  }, []);

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

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
        mode: connectionMode,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        mode: connectionMode,
      };

      setMessages([...updatedMessages, assistantMessage]);
      setIsStreaming(true);

      const chatHistory: ChatMessage[] = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let fullResponse = '';

      const onChunk = (text: string) => {
        fullResponse += text;
        const updated = fullResponse;
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: updated };
          }
          return copy;
        });
      };

      try {
        if (connectionMode === 'home') {
          const config = await getServerConfig();
          if (!config) throw new Error('Server not configured');

          try {
            await sendMessageToServer(chatHistory, config, onChunk);
          } catch {
            // Streaming failed, try non-streaming
            fullResponse = await sendMessageToServerNonStreaming(chatHistory, config);
            onChunk(fullResponse);
          }
        } else if (connectionMode === 'local') {
          const apiKey = await getClaudeApiKey();
          if (!apiKey) throw new Error('Claude API key not configured');
          const model = await getModel();

          try {
            await sendMessageLocal(chatHistory, apiKey, model, onChunk);
          } catch {
            // Streaming failed, try non-streaming
            fullResponse = await sendMessageLocalNonStreaming(chatHistory, apiKey, model);
            onChunk(fullResponse);
          }
        } else {
          throw new Error('No connection available. Configure a server URL or Claude API key in Settings.');
        }

        const finalMessages: Message[] = [
          ...updatedMessages,
          { ...assistantMessage, content: fullResponse, timestamp: Date.now() },
        ];
        setMessages(finalMessages);
        await persistConversation(finalMessages);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        // Remove the empty assistant message on error
        setMessages(updatedMessages);
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, connectionMode, persistConversation],
  );

  const clearChat = useCallback(async () => {
    setMessages([]);
    setError(null);
    conversationIdRef.current = null;
  }, []);

  return { messages, isStreaming, error, sendMessage, clearChat };
}
