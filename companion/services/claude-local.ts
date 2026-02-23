import type { ChatMessage } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

const SYSTEM_PROMPT = [
  'You are Claude, a helpful AI assistant accessed via the Remote Companion mobile app.',
  'Be concise and helpful. Format responses using markdown when appropriate.',
].join('\n');

export async function sendMessageLocal(
  messages: ChatMessage[],
  apiKey: string,
  model: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude API error ${response.status}: ${body}`);
  }

  // Try streaming first, fall back to reading the full body
  if (response.body && typeof response.body.getReader === 'function') {
    return parseSSEStream(response.body.getReader(), onChunk);
  }

  // Fallback: read the entire body and parse SSE events from text
  const text = await response.text();
  return parseSSEText(text, onChunk);
}

export async function sendMessageLocalNonStreaming(
  messages: ChatMessage[],
  apiKey: string,
  model: string,
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find(
    (b: { type: string }) => b.type === 'text',
  );
  return textBlock?.text ?? '';
}

async function parseSSEStream(
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
      const text = extractTextFromSSELine(line);
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    const text = extractTextFromSSELine(buffer);
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }

  return fullText;
}

function parseSSEText(
  text: string,
  onChunk: (text: string) => void,
): string {
  let fullText = '';
  const lines = text.split('\n');

  for (const line of lines) {
    const extracted = extractTextFromSSELine(line);
    if (extracted) {
      fullText += extracted;
      onChunk(extracted);
    }
  }

  return fullText;
}

function extractTextFromSSELine(line: string): string | null {
  if (!line.startsWith('data: ')) return null;

  const data = line.slice(6).trim();
  if (data === '[DONE]') return null;

  try {
    const event = JSON.parse(data);
    if (
      event.type === 'content_block_delta' &&
      event.delta?.type === 'text_delta' &&
      event.delta?.text
    ) {
      return event.delta.text;
    }
  } catch {
    // Not valid JSON, skip
  }

  return null;
}
