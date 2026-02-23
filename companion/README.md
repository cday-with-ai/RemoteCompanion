# Remote Companion — Mobile App

Expo/React Native app for chatting with Claude and monitoring your AI agents.

## Setup

```bash
npm install
npx expo start
```

Open in Expo Go (scan QR code) or press `w` for web.

## Project Structure

```
app/
  (tabs)/
    index.tsx          # Chat tab
    dashboard.tsx      # Dashboard tab (Phase 2 placeholder)
    settings.tsx       # Server URL, API keys, model config
  _layout.tsx          # Root layout with navigation
components/
  chat/
    ChatView.tsx       # Main chat interface (FlatList + input)
    MessageBubble.tsx  # User/assistant message rendering
    ConnectionBadge.tsx # Home/Local/Offline status indicator
  common/
    MarkdownRenderer.tsx # Styled markdown for assistant responses
services/
  auth.ts              # SecureStore/AsyncStorage credential management
  claude-local.ts      # Direct Anthropic API via fetch (Local mode)
  api.ts               # Home server HTTP client (Home mode)
  connection.ts        # Auto-detect connection mode
  storage.ts           # Conversation persistence (AsyncStorage)
hooks/
  useChat.ts           # Chat state, message routing, streaming
  useConnection.ts     # Connection mode with periodic recheck
types/
  index.ts             # Shared TypeScript types
```

## Connection Modes

| Mode | How it works | When |
|------|-------------|------|
| Home | Routes through home server | Server reachable via Tailscale/LAN |
| Local | Direct `fetch` to Anthropic API | Server unreachable, API key configured |
| Offline | No connection | Neither available |

Auto-detection runs on launch, every 30 seconds, and when the app foregrounds.

## Key Design Decisions

- **No `@anthropic-ai/sdk` in the app** — It requires Node.js APIs. Local mode uses raw `fetch` with manual SSE parsing.
- **Expo Go compatible** — All Phase 1 dependencies work without a custom dev build.
- **Platform-aware storage** — `expo-secure-store` on iOS/Android, `AsyncStorage` fallback on web.
- **Enter to send on web** — Shift+Enter for newlines.

## Dependencies

| Package | Purpose |
|---------|---------|
| `expo-router` | File-based tab navigation |
| `expo-secure-store` | Keychain/Keystore credential storage |
| `@react-native-async-storage/async-storage` | Conversation persistence |
| `react-native-markdown-display` | Markdown rendering in chat |
