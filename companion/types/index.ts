export type ConnectionMode = 'home' | 'local' | 'offline';

export interface SmsAction {
  type: 'sms';
  recipient: string;
  body: string;
}

export type MessageAction = SmsAction;

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode: ConnectionMode;
  source?: 'chat' | 'push';
  action?: MessageAction;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ServerConfig {
  url: string;
  apiKey: string;
}

export interface LocalConfig {
  claudeApiKey: string;
  model: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
