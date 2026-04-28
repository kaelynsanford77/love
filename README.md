# Lovable Solo — AI-Powered IDE

A self-hosted, mobile-first AI IDE — your personal Lovable clone. Build web apps from your desktop or phone using Claude, Gemini, and GPT models through a single API.

## ✨ Features

- 🤖 **AI Chat** — Describe what to build, AI writes the code (streaming, with tool calls)
- 📱 **Mobile-first** — Beautiful on phones (PWA + Capacitor native support)
- 🗂️ **Multi-project** — Manage multiple projects with one-click switching
- 📥 **GitHub Import** — Import any public GitHub repo with one click
- 🗄️ **Supabase** — Connect your database, browse tables, run SQL, auto-gen types
- 🧠 **Smart routing** — Auto-picks model tier (haiku→sonnet→opus) based on task complexity
- ⌨️ **Monaco editor** — Full IDE with file tree, tabs, syntax highlighting
- ⚡ **Cmd+K** — Command palette for everything

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) — `curl -fsSL https://bun.sh/install | bash`
- A [Quatarly](https://api.quatarly.cloud/api-key) API key (free tier available)

### Run locally

```bash
git clone https://github.com/kaelynsanford77/love.git
cd love
cp .env.example .env
# Edit .env: set OPENAI_API_KEY to your Quatarly key
bun install
bun run dev
# Open http://localhost:3000
```

### Run with Docker

```bash
cp .env.example .env
# Edit .env
docker compose up -d
# Open http://localhost:3000
```

## 📱 Mobile Usage

### PWA (instant, no app store)
1. Open `http://your-server:3000` in mobile browser
2. iOS: Safari → Share → **Add to Home Screen**
3. Android: Chrome → Menu → **Add to Home Screen**

### Capacitor (native app)
```bash
cd apps/ide
bun run build
bun run cap:sync
bun run cap:ios      # Opens Xcode
bun run cap:android  # Opens Android Studio
```

## 🧠 LLM Configuration (Quatarly)

```env
OPENAI_API_KEY=your-quatarly-key
OPENAI_BASE_URL=https://api.quatarly.cloud/v1
LLM_ROUTING=auto
LLM_MODEL_FAST=claude-haiku-4-5-20251001
LLM_MODEL_STANDARD=claude-sonnet-4-6-thinking
LLM_MODEL_POWERFUL=claude-opus-4-6-thinking
```

The smart router automatically selects the right model:
- ⚡ **Haiku** — Simple fixes, typos, color changes (fast & cheap)
- 🔵 **Sonnet** — General coding, new features (balanced)
- 🟣 **Opus** — Complex architecture, large refactors (powerful)

## 📁 Structure

```
love/
├── apps/
│   ├── ide/          # React + Vite + Tailwind frontend
│   └── orchestrator/ # Bun + Hono backend API
├── infra/
│   └── Caddyfile     # Reverse proxy config
├── docker-compose.yml
├── .env.example
├── LOVABLE.md        # Full spec
└── README.md
```

## 🔑 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+K` | Open command palette |
| `Cmd/Ctrl+S` | Save current file |
| `Enter` in chat | Send message |
| `Shift+Enter` | New line in chat |

## 📖 Full Specification

See [LOVABLE.md](./LOVABLE.md) for the complete blueprint.
