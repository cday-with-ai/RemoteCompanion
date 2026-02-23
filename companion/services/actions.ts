import type { MessageAction, SmsAction } from '../types';

const ACTION_REGEX = /<!--ACTION:(.*?)-->/s;

interface ExtractResult {
  content: string;
  action?: MessageAction;
}

export function extractAction(text: string): ExtractResult {
  const match = ACTION_REGEX.exec(text);
  if (!match) {
    return { content: text };
  }

  try {
    const parsed = JSON.parse(match[1]) as Record<string, unknown>;

    if (parsed['type'] === 'sms') {
      const action: SmsAction = {
        type: 'sms',
        recipient: String(parsed['recipient'] ?? ''),
        body: String(parsed['body'] ?? ''),
      };

      if (action.recipient && action.body) {
        const content = text.replace(match[0], '').trim();
        return { content, action };
      }
    }
  } catch {
    // Malformed action tag, ignore
  }

  return { content: text };
}
