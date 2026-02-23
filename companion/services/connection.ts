import type { ConnectionMode } from '../types';
import { getServerConfig, getClaudeApiKey } from './auth';
import { checkServerHealth } from './api';

export async function detectConnectionMode(): Promise<ConnectionMode> {
  const serverConfig = await getServerConfig();

  if (serverConfig?.url) {
    const healthy = await checkServerHealth(serverConfig.url);
    if (healthy) return 'home';
  }

  const claudeKey = await getClaudeApiKey();
  if (claudeKey) return 'local';

  return 'offline';
}
