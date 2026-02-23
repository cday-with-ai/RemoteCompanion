# Remote Companion — Home Server

Node.js/Express server that relays chat requests to Claude Code running on your Mac.

## Setup

```bash
npm install
npm run build
node dist/server.js
```

The server listens on `0.0.0.0:3001` by default.

## How It Works

The server spawns the `claude` CLI for each chat request:

```
POST /chat → spawn claude -p "prompt" --max-turns 100 → stream stdout back as SSE
```

This means Claude Code handles its own auth, skills, and tools — the server is a thin relay.

## API

### `GET /health`

Health check (no auth required).

```json
{ "status": "ok", "version": "0.1.0", "timestamp": 1234567890 }
```

### `POST /chat`

Send a chat message. Requires auth if `CLAUDE_SERVER_API_KEY` is set.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Any urgent emails?" }
  ],
  "stream": true
}
```

**Streaming response** (`stream: true`): Server-Sent Events with `{ type: "text", text: "..." }` chunks, terminated by `[DONE]`.

**Non-streaming response** (`stream: false`):
```json
{ "response": "Claude's full response here" }
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | `3001` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `CLAUDE_COMMAND` | `claude` | Path to Claude CLI |
| `CLAUDE_MAX_TURNS` | `100` | Max turns per request |
| `CLAUDE_SERVER_API_KEY` | (none) | API key for auth. If unset, all requests allowed (dev mode). |

## Project Structure

```
src/
  server.ts            # Express app entry point
  routes/
    health.ts          # GET /health
    chat.ts            # POST /chat (SSE streaming)
  auth/
    middleware.ts       # Bearer token validation
  claude/
    client.ts          # Spawns claude CLI, streams output
```

## Security

- **No API key = dev mode** — All requests allowed. Set `CLAUDE_SERVER_API_KEY` for production.
- **Auth via Bearer token** — `Authorization: Bearer <key>` header on all routes except `/health`.
- **Bind to Tailscale only** — Set `HOST` to your Tailscale IP to restrict access to your private network.
