# Lovable Solo — AI-IDE

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![Hono](https://img.shields.io/badge/Hono-4-orange)](https://hono.dev)
[![Tauri](https://img.shields.io/badge/Tauri-v2-24c8db?logo=tauri)](https://tauri.app)

> A self-hosted, production-quality AI-powered IDE that mirrors the core [Lovable.dev](https://lovable.dev) experience — runs entirely on your machine or VPS, with zero vendor lock-in.

---

## Table of Contents

1. [Overview](#overview)
2. [Screenshots](#screenshots)
3. [Features](#features)
4. [Prerequisites](#prerequisites)
5. [Quick Start](#quick-start)
6. [Configuration](#configuration)
7. [Architecture](#architecture)
8. [API Routes](#api-routes)
9. [Desktop Build (Tauri)](#desktop-build-tauri)
10. [Mobile Build (Capacitor)](#mobile-build-capacitor)
11. [Docker Deployment](#docker-deployment)
12. [VPS Deployment](#vps-deployment)
13. [Keyboard Shortcuts](#keyboard-shortcuts)
14. [Troubleshooting](#troubleshooting)
15. [Contributing](#contributing)

---

## Overview

Lovable Solo gives you a fully local, AI-assisted web IDE. Chat with an LLM (Claude, GPT-4, or a local Ollama model) and watch it read, write, and refactor your code in real time. Every interaction goes through a local orchestrator that tools into your filesystem — no data ever leaves your machine unless you choose a cloud LLM provider.

---

## Screenshots

| View | Description |
|------|-------------|
| **Main IDE** | Split-pane layout: AI chat on the left, Monaco editor in the centre, live iframe preview on the right. Dark theme with a deep-navy sidebar. |
| **AI Chat** | Streaming markdown responses, code blocks with syntax highlighting, inline diff indicators, and a token usage counter. |
| **File Explorer** | Tree view with create/rename/delete actions, git status badges (modified, untracked, staged), and a fuzzy-search overlay. |
| **Live Preview** | Sandboxed iframe with toolbar to switch between desktop (1440 px), tablet (768 px), and mobile (375 px) viewports. |
| **Cloud Panel** | Table browser, inline SQL editor, and query result grid backed by PostgreSQL + pgvector. |
| **Analytics** | Recharts dashboard showing page views, session durations, and custom event counts over time. |
| **Git History** | Commit timeline with diffs, branch switcher, and one-click commit / push. |
| **Deploy** | One-click publish button that triggers a build and surfaces a shareable preview URL. |

---

## Features

- 🤖 **AI Chat** — streaming LLM responses via Anthropic Claude, OpenAI GPT-4, or local Ollama models
- 🛠️ **Tool use** — the AI can read/write files, run shell commands, search code, and commit changes
- 👁️ **Live Preview** — hot-reloading iframe preview with viewport switching
- 📂 **Monaco Editor** — multi-tab, full LSP-style editing experience
- ☁️ **Cloud Panel** — PostgreSQL table browser and SQL query runner
- 📊 **Analytics** — Recharts dashboard for project metrics
- 🔀 **Split View** — resizable chat + editor + preview panes
- 📜 **Git Integration** — commit, log, diff, branch management
- 🖥️ **Desktop app** — Tauri v2 wrapper (macOS, Windows, Linux)
- 📱 **Mobile app** — Capacitor wrapper (iOS, Android)
- 🐳 **Docker** — one-command stack with Caddy reverse proxy
- 🔐 **Bearer token auth** — optional API protection

---

## Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| [Bun](https://bun.sh) | ≥ 1.1 | ✅ Always |
| Node.js | ≥ 20 (used by some Vite plugins) | ✅ Always |
| Anthropic **or** OpenAI API key | — | ✅ One required |
| [Docker](https://docs.docker.com/get-docker/) + Compose v2 | latest | Optional (full stack) |
| [Rust](https://rustup.rs) + `tauri-cli` v2 | stable | Optional (desktop build) |
| [Xcode](https://developer.apple.com/xcode/) / [Android Studio](https://developer.android.com/studio) | latest | Optional (mobile build) |

Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-org/lovable-solo.git
cd lovable-solo

# 2. Configure
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY or OPENAI_API_KEY

# 3. Install dependencies
bun install

# 4. Run (IDE + Orchestrator in parallel)
bun run dev
```

Open **http://localhost:3000** — the IDE is live.

The orchestrator API runs on **http://localhost:4000**.

---

## Configuration

Copy `.env.example` to `.env` and fill in the values:

```dotenv
# ── LLM Providers ────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...          # Anthropic Claude (recommended)
OPENAI_API_KEY=sk-...                 # OpenAI GPT-4 (alternative)
OLLAMA_BASE_URL=http://localhost:11434 # Local Ollama (fully offline)

# Default provider: anthropic | openai | ollama
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-5-sonnet-20241022

# ── Security ─────────────────────────────────────────────────────────────────
BEARER_TOKEN=change-me-in-production  # Protects /chat/* routes

# ── Ports ────────────────────────────────────────────────────────────────────
IDE_PORT=3000
ORCHESTRATOR_PORT=4000

# ── Filesystem ───────────────────────────────────────────────────────────────
WORKSPACES_ROOT=./workspaces          # Absolute or relative path

# ── Database (optional) ──────────────────────────────────────────────────────
DATABASE_URL=postgresql://lovable:lovable@localhost:5432/lovable

# ── Sandbox ──────────────────────────────────────────────────────────────────
SANDBOX_MODE=local                    # local | docker

# ── Production (Caddy) ───────────────────────────────────────────────────────
DOMAIN=yourdomain.com
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=changeme

# ── IDE (Vite client) ────────────────────────────────────────────────────────
VITE_ORCHESTRATOR_URL=http://localhost:4000
VITE_BEARER_TOKEN=                    # Leave blank for local dev
```

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Browser / Tauri / Capacitor            │
│                                                            │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│   │  Chat Panel  │   │ Monaco Editor│   │ Live Preview │  │
│   │  (React)     │   │  (React)     │   │  (iframe)    │  │
│   └──────┬───────┘   └──────┬───────┘   └──────────────┘  │
│          │  REST / SSE       │                             │
└──────────┼───────────────────┼─────────────────────────────┘
           │                   │
           ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│               Orchestrator  (Bun + Hono, :4000)             │
│                                                             │
│  /chat   /fs   /exec   /git   /search   /projects           │
│  /runtime   /db   /publish   /preview   /healthz            │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │  LLM Client  │   │  simple-git  │   │  child_process │  │
│  │  (Anthropic/ │   │  (git ops)   │   │  (exec cmds)   │  │
│  │   OpenAI/    │   └──────────────┘   └────────────────┘  │
│  │   Ollama)    │                                           │
│  └──────────────┘                                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Workspaces  (~/workspaces/<project>)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│  PostgreSQL + pgvec │  (optional, for cloud panel & embeddings)
└─────────────────────┘
```

**Monorepo layout:**

```
lovable-solo/
├── apps/
│   ├── ide/          # Vite + React frontend (:3000)
│   └── orchestrator/ # Bun + Hono backend  (:4000)
│       └── src/
│           ├── server.ts
│           └── routes/
│               ├── chat.ts · fs.ts · exec.ts · git.ts
│               ├── search.ts · classify.ts · preview.ts
├── src-tauri/        # Tauri v2 desktop wrapper
├── docker/           # Docker Compose, Dockerfile, schema.sql
├── workspaces/       # Default project workspace
├── capacitor.config.ts
├── Caddyfile
└── .env.example
```

---

## API Routes

All routes are served by the orchestrator on port `4000`.

### Core

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Service info + timestamp |
| `GET` | `/health` | Simple health check (`{ ok: true }`) |
| `GET` | `/healthz` | Detailed health (`ok`, `uptime`, `ts`) |

### Chat (protected by `BEARER_TOKEN` when set)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat` | Send a message; returns SSE stream of LLM tokens + tool calls |

### Filesystem

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/fs/read` | Read a file (`?path=`) |
| `POST` | `/fs/write` | Write a file (`{ path, content }`) |
| `GET` | `/fs/list` | List directory (`?path=`) |
| `POST` | `/fs/delete` | Delete a file or directory |
| `POST` | `/fs/rename` | Rename / move a file |

### Execution

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/exec` | Run a shell command in the workspace |

### Git

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/git/log` | Commit history |
| `POST` | `/git/commit` | Stage all + commit |
| `GET` | `/git/diff` | Working-tree diff |
| `GET` | `/git/status` | Porcelain status |
| `POST` | `/git/branch` | Create / switch branch |

### Search & Classify

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/search` | Fuzzy file + content search (`?q=`) |
| `POST` | `/classify` | Classify intent of a chat message |

### Projects

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects` | List all project directories |
| `POST` | `/projects/switch` | Switch active project (`{ projectId }`) |
| `POST` | `/projects/create` | Create new project + git init (`{ name }`) |

### Runtime

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/runtime/status` | Running status + PID |
| `POST` | `/runtime/restart` | Soft-restart signal |

### Database

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/db/tables` | List tables (requires `DATABASE_URL`) |
| `POST` | `/db/query` | Execute SQL (`{ sql, params }`) |

### Preview & Publish

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/preview/:projectId` | Serve built preview |
| `POST` | `/publish` | Trigger build + return preview URL |

### Analytics & Cloud (stubs)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/analytics` | Analytics stats stub |
| `GET` | `/cloud/tables` | Cloud DB tables stub |
| `POST` | `/cloud/sql` | Cloud SQL stub |

---

## Desktop Build (Tauri)

Requires Rust stable and `tauri-cli` v2.

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
cargo install tauri-cli --version "^2"

# Dev mode (hot-reload)
cargo tauri dev

# Production build (outputs to src-tauri/target/release/bundle/)
cargo tauri build
```

The Tauri config lives at `src-tauri/tauri.conf.json`. It points `frontendDist` at `apps/ide/dist` and launches the IDE dev server before running the desktop window.

Platform bundles produced:
- **macOS** — `.dmg` + `.app`
- **Windows** — `.msi` + `.exe` (NSIS)
- **Linux** — `.deb` + `.AppImage` + `.rpm`

---

## Mobile Build (Capacitor)

```bash
# Install Capacitor CLI + platforms
bun add -D @capacitor/cli @capacitor/core @capacitor/ios @capacitor/android
bun add @capacitor/splash-screen

# Build the web app first
bun run --cwd apps/ide build

# Add platforms (first time only)
bunx cap add ios
bunx cap add android

# Sync web assets into native projects
bunx cap sync

# Open in Xcode / Android Studio
bunx cap open ios
bunx cap open android
```

The Capacitor config lives at `capacitor.config.ts`. Set `webDir` to `apps/ide/dist` — the compiled IDE bundle.

For live-reload during development, uncomment the `server.url` field and point it at `http://<your-local-ip>:3000`.

---

## Docker Deployment

```bash
# Copy and configure env
cp .env.example .env
# Fill in API keys

# Start full stack (orchestrator + IDE + Caddy)
bun run docker:up

# Stop
bun run docker:down
```

Services:
- **orchestrator** — Bun server on `:4000`
- **ide** — Vite dev server on `:3000`
- **caddy** — Reverse proxy on `:80` / `:443` with automatic HTTPS

To add PostgreSQL + pgvector, extend `docker/docker-compose.yml`:

```yaml
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: lovable
      POSTGRES_PASSWORD: lovable
      POSTGRES_DB: lovable
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

volumes:
  pg_data:
```

Then set `DATABASE_URL=postgresql://lovable:lovable@db:5432/lovable` in your `.env`.

---

## VPS Deployment

### 1 — Provision

Tested on Ubuntu 22.04 LTS (1 vCPU, 1 GB RAM minimum; 2 vCPU / 2 GB recommended).

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2 — Deploy

```bash
git clone https://github.com/your-org/lovable-solo.git /opt/lovable-solo
cd /opt/lovable-solo
cp .env.example .env
# Edit .env — set DOMAIN, API keys, BEARER_TOKEN, BASIC_AUTH_PASS
nano .env

docker compose -f docker/docker-compose.yml up -d --build
```

### 3 — DNS

Point your domain's A record to the VPS IP. Caddy will obtain a Let's Encrypt certificate automatically.

### 4 — Systemd (alternative to Docker)

```ini
# /etc/systemd/system/lovable-solo.service
[Unit]
Description=Lovable Solo
After=network.target

[Service]
WorkingDirectory=/opt/lovable-solo
EnvironmentFile=/opt/lovable-solo/.env
ExecStart=/root/.bun/bin/bun run dev
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now lovable-solo
sudo journalctl -fu lovable-solo
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘/Ctrl + Enter` | Send chat message |
| `⌘/Ctrl + K` | Open fuzzy file finder |
| `⌘/Ctrl + Shift + P` | Command palette |
| `⌘/Ctrl + \` | Toggle file explorer |
| `⌘/Ctrl + J` | Toggle terminal panel |
| `⌘/Ctrl + B` | Toggle sidebar |
| `⌘/Ctrl + Shift + E` | Focus file explorer |
| `⌘/Ctrl + Shift + F` | Global search |
| `⌘/Ctrl + Z` | Undo last edit |
| `⌘/Ctrl + Shift + Z` | Redo |
| `⌘/Ctrl + S` | Save (auto-saves in IDE) |
| `F5` | Reload preview iframe |
| `Alt + 1/2/3` | Switch preview viewport (desktop/tablet/mobile) |
| `Esc` | Close modal / dismiss overlay |

---

## Troubleshooting

### Port already in use

```bash
# Find and kill process on port 4000
lsof -ti:4000 | xargs kill -9
```

### `bun install` fails on Apple Silicon

```bash
# Ensure Rosetta is not interfering
arch -arm64 bun install
```

### LLM returns empty responses

- Verify your API key is set: `echo $ANTHROPIC_API_KEY`
- Check the orchestrator logs: `bun run --cwd apps/orchestrator dev`
- For Ollama, ensure the model is pulled: `ollama pull llama3`

### Monaco editor doesn't load

The editor loads a web worker from a CDN. Make sure `Content-Security-Policy` is not blocking `blob:` or `*.jsdelivr.net` in your reverse proxy config.

### Tauri build fails — missing system deps (Linux)

```bash
sudo apt update && sudo apt install -y \
  libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

### Docker: `permission denied` on workspaces volume

```bash
sudo chown -R 1000:1000 ./workspaces
```

### Database connection refused

Ensure `DATABASE_URL` is set and PostgreSQL is reachable. To test:

```bash
psql "$DATABASE_URL" -c "SELECT 1;"
```

If using Docker, make sure the `db` service is healthy before the orchestrator starts (use `depends_on` with `condition: service_healthy`).

---

## Contributing

1. Fork and clone the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Install deps: `bun install`
4. Start dev: `bun run dev`
5. Make changes, add tests if applicable
6. Commit with a conventional message: `git commit -m "feat: add X"`
7. Push and open a pull request

### Code style

- TypeScript strict mode throughout
- Prettier + ESLint (run `bun run lint` before pushing)
- No `any` — prefer `unknown` + type guards

### Reporting bugs

Open a GitHub Issue with:
- OS and Bun/Node version
- Relevant `.env` values (redact secrets)
- Full error output from the orchestrator console

---

## License

MIT © Lovable Solo Contributors


### Install & Run

```bash
cp .env.example .env
# Edit .env and add your API key
bun install
bun run dev
```

- IDE: http://localhost:3000
- Orchestrator: http://localhost:4000

### Docker

```bash
bun run docker:up
```

## Configuration (.env)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `LLM_PROVIDER` | anthropic / openai / ollama |
| `LLM_MODEL` | Model name |
| `BEARER_TOKEN` | Optional auth |
| `WORKSPACES_ROOT` | Project files location |

## License

MIT
