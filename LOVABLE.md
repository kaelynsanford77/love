# Lovable Solo — AI-Powered IDE

A self-hosted, full-stack AI IDE clone powered by your own LLM keys.

## Features

- 🤖 **AI Chat** — Stream responses from any OpenAI-compatible API (Quatarly, OpenAI, Anthropic-via-proxy)
- ⚡ **Smart LLM Routing** — Automatically routes requests to fast/standard/powerful models based on complexity
- 📁 **Project Management** — Create, import from GitHub, and manage multiple projects
- 🖥️ **Monaco Editor** — Full VS Code-grade editor with syntax highlighting
- 👁️ **Live Preview** — Instant preview of running dev servers
- ☁️ **Supabase Integration** — Connect your Supabase projects, browse tables, run SQL
- 📱 **Mobile-first** — Responsive UI with bottom navigation for mobile

## Quick Start

```bash
cp .env.example .env
# Edit .env with your API key
bun install
bun run dev
```

## Architecture

- **apps/ide** — React + Vite + TypeScript frontend
- **apps/orchestrator** — Bun/Hono backend API
- **packages/shared** — Shared TypeScript types

## LLM Routing

Set `LLM_ROUTING=auto` to let the system pick the best model:
- 🟢 **Fast** (haiku) — Simple fixes, rename, style changes
- 🔵 **Standard** (sonnet) — Normal feature work
- 🟣 **Powerful** (opus) — Complex refactors, architecture, migrations
