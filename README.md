# Lovable Solo – AI-IDE Clone

A self-hosted, production-quality AI IDE that mirrors the core Lovable.dev experience. Built with React + Vite (IDE) and Bun + Hono (orchestrator).

## Features

- 🤖 **AI Chat** with streaming LLM (Anthropic Claude / OpenAI / Ollama)
- 🛠️ **Tool-use** – the AI can read/write files, run commands, list files
- 👁️ **Live Preview** – iframe preview with viewport switching (desktop/tablet/mobile)
- 📂 **Code Editor** – Monaco editor with multi-tab support
- ☁️ **Cloud Panel** – Database tables, SQL editor, RLS stub
- 📊 **Analytics** – Recharts-powered metrics dashboard
- 🔀 **Split View** – Chat + preview side by side
- 📜 **Git History** – Commit, log, diff

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) >= 1.1
- Anthropic or OpenAI API key

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
