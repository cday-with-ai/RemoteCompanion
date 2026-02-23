import { spawn } from 'node:child_process';

const CLAUDE_COMMAND = process.env['CLAUDE_COMMAND'] ?? 'claude';
const MAX_TURNS = parseInt(process.env['CLAUDE_MAX_TURNS'] ?? '100', 10);

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function streamChatResponse(
  messages: ChatMessage[],
  onData: (chunk: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Build the prompt from the last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) {
      reject(new Error('No user message found'));
      return;
    }

    // Build conversation context for multi-turn
    const prompt = buildPrompt(messages);

    const args = [
      '-p', prompt,
      '--max-turns', String(MAX_TURNS),
      '--verbose',
    ];

    const child = spawn(CLAUDE_COMMAND, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      onData(text);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Claude exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });
  });
}

export async function chatResponse(messages: ChatMessage[]): Promise<string> {
  let result = '';
  await streamChatResponse(messages, (chunk) => {
    result += chunk;
  });
  return result;
}

function buildPrompt(messages: ChatMessage[]): string {
  if (messages.length === 1) {
    return messages[0].content;
  }

  // For multi-turn, include conversation context
  const parts = messages.map((m) => {
    const prefix = m.role === 'user' ? 'User' : 'Assistant';
    return `${prefix}: ${m.content}`;
  });

  return parts.join('\n\n');
}
