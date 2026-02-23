# Remote Companion

A cross-platform mobile app that connects to your personal AI agent ecosystem running on your Mac. Chat with Claude, check on your agents, and stay informed — from anywhere.

## Architecture

```
RemoteCompanion/
  companion/    # Expo/React Native mobile app (iOS, Android, Web)
  server/       # Node.js home server (Express, Claude Code CLI)
```

### Two Connection Modes

- **Home** — Routes through the home server via Tailscale. Full access to your agent ecosystem (Heartbeat, Newsbot, Mailbot, etc.) through Claude Code.
- **Local** — Direct Claude API calls from the device. Works anywhere, no server required. Chat-only (no agent access).

The app auto-detects which mode is available and falls back gracefully.

## Quick Start

### 1. Start the server

```bash
cd server
npm install
npm run build
node dist/server.js
```

The server listens on `http://0.0.0.0:3001`.

### 2. Start the app

```bash
cd companion
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `w` for web.

### 3. Configure

In the app's **Settings** tab:
- **Home mode**: Enter your server URL (`http://localhost:3001` for local, or your Tailscale IP for remote)
- **Local mode**: Enter your Anthropic API key for direct Claude access

## Remote Access with Tailscale

For access from anywhere (not just your local network):

1. Install [Tailscale](https://tailscale.com) on your Mac and iPhone
2. Sign in with the same account on both devices
3. Get your Mac's Tailscale IP: `tailscale ip`
4. Enter `http://<tailscale-ip>:3001` as the server URL in the app

All traffic is encrypted with WireGuard. No port forwarding required.

## Security

- **Tailscale** — Private mesh VPN, only your devices can reach the server
- **API Key Auth** — Per-device bearer token (set `CLAUDE_SERVER_API_KEY` env var)
- **Secure Storage** — Credentials stored in iOS Keychain / Android Keystore via `expo-secure-store`

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Mobile App | Expo SDK 54, React Native, TypeScript |
| Routing | expo-router v6 (file-based) |
| Server | Node.js, Express, TypeScript |
| AI | Claude Code CLI (server), Anthropic API (local) |
| Networking | Tailscale (WireGuard mesh VPN) |
| Storage | AsyncStorage (conversations), SecureStore (credentials) |

## Roadmap

- **Phase 1** (current) — Chat with streaming, dual connection modes, conversation persistence
- **Phase 2** — Agent dashboard, WebSocket live updates, push notifications, skill routing
- **Phase 3** — Voice input/output, Face ID, home screen widgets
