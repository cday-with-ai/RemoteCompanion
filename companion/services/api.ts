import type { ChatMessage, ServerConfig } from '../types';

export async function checkServerHealth(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${url}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export async function sendMessageToServer(
  messages: ChatMessage[],
  config: ServerConfig,
  onChunk: (text: string) => void,
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(`${config.url}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages, stream: true }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Server error ${response.status}: ${body}`);
  }

  if (response.body && typeof response.body.getReader === 'function') {
    return parseServerSSE(response.body.getReader(), onChunk);
  }

  // Fallback: read full body
  const text = await response.text();
  return parseServerSSEText(text, onChunk);
}

export async function sendMessageToServerNonStreaming(
  messages: ChatMessage[],
  config: ServerConfig,
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(`${config.url}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages, stream: false }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Server error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.response ?? '';
}

async function parseServerSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (text: string) => void,
): Promise<string> {
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const text = extractTextFromLine(line);
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
  }

  return fullText;
}

function parseServerSSEText(
  text: string,
  onChunk: (text: string) => void,
): string {
  let fullText = '';
  for (const line of text.split('\n')) {
    const extracted = extractTextFromLine(line);
    if (extracted) {
      fullText += extracted;
      onChunk(extracted);
    }
  }
  return fullText;
}

function extractTextFromLine(line: string): string | null {
  if (!line.startsWith('data: ')) return null;

  const data = line.slice(6).trim();
  if (data === '[DONE]') return null;

  try {
    const event = JSON.parse(data);
    // Server sends { type: 'text', text: '...' } from claude CLI output
    if (event.type === 'text' && event.text) {
      return event.text;
    }
  } catch {
    // Not valid JSON, skip
  }

  return null;
}
