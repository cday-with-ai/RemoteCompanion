export type ConnectionMode = 'home' | 'local' | 'offline';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode: ConnectionMode;
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
