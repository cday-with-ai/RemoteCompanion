import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Conversation } from '../types';

const LIST_KEY = 'conv:list';
const CURRENT_KEY = 'conv:current';

interface ConversationMeta {
  id: string;
  title: string;
  updatedAt: number;
}

export async function saveConversation(conv: Conversation): Promise<void> {
  await AsyncStorage.setItem(`conv:${conv.id}`, JSON.stringify(conv));

  const list = await listConversationMeta();
  const existing = list.findIndex((c) => c.id === conv.id);
  const meta: ConversationMeta = {
    id: conv.id,
    title: conv.title,
    updatedAt: conv.updatedAt,
  };

  if (existing >= 0) {
    list[existing] = meta;
  } else {
    list.unshift(meta);
  }

  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(list));
}

export async function loadConversation(
  id: string,
): Promise<Conversation | null> {
  const raw = await AsyncStorage.getItem(`conv:${id}`);
  if (!raw) return null;
  return JSON.parse(raw) as Conversation;
}

export async function listConversationMeta(): Promise<ConversationMeta[]> {
  const raw = await AsyncStorage.getItem(LIST_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as ConversationMeta[];
}

export async function deleteConversation(id: string): Promise<void> {
  await AsyncStorage.removeItem(`conv:${id}`);

  const list = await listConversationMeta();
  const filtered = list.filter((c) => c.id !== id);
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(filtered));

  const current = await getCurrentConversationId();
  if (current === id) {
    await AsyncStorage.removeItem(CURRENT_KEY);
  }
}

export async function getCurrentConversationId(): Promise<string | null> {
  return AsyncStorage.getItem(CURRENT_KEY);
}

export async function setCurrentConversationId(id: string): Promise<void> {
  await AsyncStorage.setItem(CURRENT_KEY, id);
}
