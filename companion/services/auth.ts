import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ServerConfig } from '../types';

const KEYS = {
  SERVER_URL: 'server_url',
  SERVER_API_KEY: 'server_api_key',
  CLAUDE_API_KEY: 'claude_api_key',
  MODEL: 'claude_model',
} as const;

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

// SecureStore is native-only. Fall back to AsyncStorage on web.
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

async function getItem(key: string): Promise<string | null> {
  if (isNative) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(`secure:${key}`);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isNative) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(`secure:${key}`, value);
  }
}

export async function getServerConfig(): Promise<ServerConfig | null> {
  const url = await getItem(KEYS.SERVER_URL);
  const apiKey = await getItem(KEYS.SERVER_API_KEY);
  if (!url) return null;
  return { url, apiKey: apiKey ?? '' };
}

export async function setServerConfig(config: ServerConfig): Promise<void> {
  await setItem(KEYS.SERVER_URL, config.url);
  await setItem(KEYS.SERVER_API_KEY, config.apiKey);
}

export async function getClaudeApiKey(): Promise<string | null> {
  return getItem(KEYS.CLAUDE_API_KEY);
}

export async function setClaudeApiKey(key: string): Promise<void> {
  await setItem(KEYS.CLAUDE_API_KEY, key);
}

export async function getModel(): Promise<string> {
  const model = await getItem(KEYS.MODEL);
  return model ?? DEFAULT_MODEL;
}

export async function setModel(model: string): Promise<void> {
  await setItem(KEYS.MODEL, model);
}
