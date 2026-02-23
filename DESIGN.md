# Remote Companion — Design Document

## What is Remote Companion?

A cross-platform mobile app (Expo/React Native) that connects to your personal AI system at home. It's your pocket interface to all the agents running on your Mac — heartbeat, mailbot, newsbot, and more. Not a terminal, not a code editor — a companion.

It pushes updates to you, answers quick questions, and gives you a dashboard of what your agents are doing.

## How It Differs From Universal Terminal

| | Universal Terminal | Remote Companion |
|---|---|---|
| Platform | macOS CLI | iOS + Android (Expo) |
| Purpose | Power user work | Stay informed, quick interactions |
| Input | Shell commands + natural language | Chat + voice |
| Mode | Pull (you ask) | Push + pull (it notifies you too) |
| Skills | Full access to everything | Curated — email, news, deliveries, status |
| Audience | You at your desk | You anywhere |

## Features

### Chat
- Rich conversational interface with markdown rendering
- Full access to your skills via the home server
- "Any urgent emails?" → mailbot
- "When does my package arrive?" → mailbot deliveries
- "What's in the news?" → newsbot
- "How are my projects doing?" → heartbeat status
- **Voice**: tap-to-talk recording, spoken responses (expo-av + expo-speech)
- **Files**: send and receive files, image previews, document attachments (expo-file-system + expo-document-picker)
- **Links**: tappable link cards in output with previews (expo-linking)
- **Media**: inline image/HTML rendering for sandbox creations, news digests
- Conversation history persisted locally

### Dashboard
- Glanceable cards showing agent status:
  - Heartbeat: running/stopped, last tick, next tick
  - Mailbot: unread count, urgent messages
  - Newsbot: latest digest summary
  - Claude Sandbox: latest creation (with thumbnail)
- Pull to refresh, auto-updates via WebSocket

### Push Notifications
- Urgent email arrives → push notification
- Amazon delivery status change → push notification
- Heartbeat task fails → push notification
- News digest ready → push notification
- Claude Sandbox created something new → push notification with preview

### Voice Mode
- Tap and hold to talk
- Uses iOS built-in speech recognition (on-device, private)
- Response spoken back via iOS speech synthesis
- Or optional ElevenLabs for better voice quality
- Hands-free mode: always listening (like VoiceClaude but on phone)

## Architecture

### System Overview

```
┌──────────────────┐         ┌──────────────────────────┐
│   iOS App        │  HTTPS  │   Home Server (Mac)      │
│   (SwiftUI)      │◄───────►│   (Node.js)              │
│                  │  WSS    │                          │
│  • Chat UI       │         │  • Claude API client     │
│  • Dashboard     │         │  • Skill router          │
│  • Voice I/O     │         │  • WebSocket for push    │
│  • Notifications │         │  • Auth middleware       │
└──────────────────┘         │  • Heartbeat integration │
                             └──────────────────────────┘
                                       │
                              ┌────────┴────────┐
                              │  Local Skills    │
                              │  • mailbot       │
                              │  • newsbot       │
                              │  • heartbeat     │
                              │  • opskill       │
                              └─────────────────┘
```

### Home Server

A lightweight Node.js/Express server running on your Mac that:
- Authenticates requests (API key + device token)
- Routes chat messages to Claude API with skill context
- Invokes local CLIs (mailbot, newsbot, heartbeat) as needed
- Pushes events to connected clients via WebSocket
- Sends push notifications via Apple Push Notification Service (APNs)

This is the shared backend that Universal Terminal could also use.

```
~/IdeaProjects/ClaudeServer/
  src/
    server.ts           # Express + WebSocket server
    routes/
      chat.ts           # POST /chat — send message, get response
      status.ts         # GET /status — agent dashboard data
      skills.ts         # POST /skill/:name — invoke a skill directly
    auth/
      middleware.ts      # API key + device token validation
    push/
      apns.ts           # Apple Push Notification Service
      events.ts         # Event bus for push triggers
    skills/
      router.ts         # Route requests to local CLIs
    claude/
      client.ts         # Claude API wrapper with skill context
```

### Mobile App (Expo)

```
companion/
  app/
    (tabs)/
      index.tsx              # Chat tab
      dashboard.tsx          # Dashboard tab
      settings.tsx           # Settings tab
    _layout.tsx              # Tab navigation layout
  components/
    chat/
      ChatView.tsx           # Main chat interface
      MessageBubble.tsx      # Chat bubbles (text, files, links, media)
      VoiceButton.tsx        # Push-to-talk FAB
      FileAttachment.tsx     # File/image preview cards
      LinkCard.tsx           # Rich link previews
    dashboard/
      AgentCard.tsx          # Individual agent status card
      SandboxPreview.tsx     # Thumbnail of latest sandbox creation
    common/
      MarkdownRenderer.tsx   # Render markdown in chat output
  services/
    api.ts                   # HTTP + WebSocket to home server
    push.ts                  # expo-notifications setup
    speech.ts                # expo-av recording + expo-speech TTS
    files.ts                 # expo-file-system + expo-document-picker
    auth.ts                  # expo-secure-store for credentials
  hooks/
    useChat.ts               # Chat state management
    useAgentStatus.ts        # Dashboard data
    useVoice.ts              # Voice recording/playback
  types/
    index.ts                 # Shared types
```

### Networking & Security

#### Tailscale — The Network Layer

Tailscale is a mesh VPN built on WireGuard that creates a private network between your devices. It works over any internet connection — home wifi, cellular, hotel wifi, coffee shop — without exposing any ports to the public internet.

**How it works:**
- Install Tailscale on your Mac and iPhone
- Both devices join your personal tailnet (private network)
- Your Mac gets a stable private IP (e.g., `100.64.x.x`) and a DNS name (e.g., `carsons-macbook.tail1234.ts.net`)
- Your phone can always reach your Mac at that address, from anywhere in the world
- All traffic is encrypted with WireGuard (fast, modern, audited)
- No port forwarding, no dynamic DNS, no public endpoints
- NAT traversal is automatic — works behind firewalls, carrier NAT, everything
- Free for personal use (up to 100 devices)

**Setup:**
```bash
# Mac
brew install tailscale
# Enable in System Settings, sign in

# iPhone
# Install Tailscale from App Store, sign in with same account
```

The home server binds only to the Tailscale interface — it is literally unreachable from the public internet.

#### Five Security Layers

```
Layer 1: Tailscale Network    — only your authenticated devices can reach the server
Layer 2: HTTPS/WSS            — encrypted transport even within Tailscale (defense in depth)
Layer 3: API Key              — per-device key, generated on setup, stored in device keychain
Layer 4: Biometric Auth       — Face ID / fingerprint to open the app (expo-local-authentication)
Layer 5: 1Password (opskill)  — all secrets managed by 1Password, never stored on disk
```

An attacker would need to: compromise your Tailscale account, intercept WireGuard-encrypted traffic, steal a device-specific API key from the iOS Keychain, bypass Face ID, AND get past 1Password. Not happening.

#### Authentication Flow

```
First-time setup:
  1. claude-server init → generates API key, displays QR code
  2. QR contains: { tailscaleIP, port, apiKey }
  3. App scans QR → stores API key in expo-secure-store (iOS Keychain)
  4. App registers device token for push notifications
  5. Done — all future requests include API key in header

Every app open:
  1. Face ID / fingerprint check
  2. App connects to home server via Tailscale IP
  3. API key sent in Authorization header
  4. WebSocket established for push updates
```

#### Data Protection

**In transit:**
- WireGuard encryption (Tailscale) + TLS (HTTPS/WSS)
- Double encrypted by default

**At rest on phone:**
- Chat history: expo-secure-store or encrypted SQLite
- API key: iOS Keychain (hardware-backed on devices with Secure Enclave)
- No message content in push notification payloads — just alert text

**At rest on server:**
- No credentials on disk — opskill pulls from 1Password at runtime
- No message logs stored server-side (stateless relay)
- Heartbeat history stays in ~/.heartbeat/.history/ (already on your machine)

**File transfers:**
- Files sent through the encrypted Tailscale tunnel
- Temporarily cached on server, deleted after delivery
- Received files stored in app sandbox (iOS manages encryption)

### Push Notification Flow

```
Heartbeat tick detects event (urgent email, delivery, etc.)
  → Home Server event bus
  → APNs push to iOS device
  → App shows notification
  → User taps notification → opens relevant view
```

For this to work, the home server needs to be running. It could be a heartbeat-managed process itself, or a separate launchd service.

## Technical Stack

### Mobile App
- **Framework**: Expo SDK 52+ (React Native)
- **Language**: TypeScript
- **UI**: React Native + expo-router (file-based routing)
- **Networking**: fetch + WebSocket
- **Voice**: expo-av (recording) + expo-speech (TTS)
- **Files**: expo-file-system + expo-document-picker + expo-sharing
- **Auth**: expo-secure-store (keychain/keystore) + expo-local-authentication (biometrics)
- **Push**: expo-notifications
- **Links**: expo-linking + expo-web-browser
- **Markdown**: react-native-markdown-display
- **Testing**: Expo Go (instant testing on device, no App Store needed)

### Home Server
- **Language**: TypeScript (ESM, Node 20+)
- **HTTP**: Express or Fastify
- **WebSocket**: ws
- **Push**: @parse/node-apn or apns2
- **Claude**: @anthropic-ai/sdk
- **Binary**: `claude-server` → `dist/server.ts`

## Setup Flow

```
1. brew install tailscale          # Install Tailscale on Mac
2. Sign into Tailscale             # Same account on Mac + iPhone
3. Install Tailscale on iPhone     # From App Store
4. claude-server init              # Generates API key, shows QR code
5. Open Remote Companion app       # Scan QR code
6. Face ID setup                   # Enable biometric lock
7. Done — chat from anywhere
```

## MVP Scope

**Phase 1 — Chat works:**
- Home server with /chat endpoint
- iOS app with basic chat UI
- Claude API integration with skill routing
- Tailscale networking
- API key auth

**Phase 2 — Dashboard + Push:**
- Agent status dashboard
- WebSocket for live updates
- Push notifications for urgent events
- Heartbeat integration

**Phase 3 — Voice + Polish:**
- Voice input/output
- Face ID
- Rich notifications with previews
- Widgets for home screen

## Open Questions

- Should the home server be its own project (ClaudeServer) shared by uterm and the app?
- Should the app work offline with cached data?
- How to handle the server being asleep/off? (Wake-on-LAN? Always-on Mac Mini?)
- Should there be an Apple Watch complication for quick status?
- Could this eventually become a Mac menu bar app too?
