# LOVABLE.md — Lovable Solo Full Specification

This document is the complete blueprint for Lovable Solo, a self-hosted AI-powered IDE that replicates the core Lovable experience.

---

## Overview

Lovable Solo is a monorepo containing:
- **`apps/ide/`** — React + Vite + Tailwind + shadcn/ui frontend
- **`apps/orchestrator/`** — Bun + Hono backend API
- **`infra/`** — Docker Compose, Caddy, Postgres schema

---

## 1. Mobile-First Phone Experience

The IDE works beautifully on phones. Users can chat with AI, edit code, preview, and publish from their phone.

### Capacitor Setup
- `apps/ide/capacitor.config.ts` pointing to the web build
- iOS and Android project shells via `cap add ios` / `cap add android`
- `capacitor-secure-storage-plugin` for token storage

### Responsive Layout (< 900px)
- Chat panel becomes a full-screen drawer — swipe from left edge or tap chat icon
- Toolbar collapses into a compact bar with icons-only mode switcher
- Preview panel takes full width
- Code editor uses 15px font, touch-friendly scroll
- Bottom navigation bar with 4 tabs: Chat | Preview | Code | More
- Touch targets: minimum 44px (Apple HIG)

### Mobile-specific features
- Voice input — microphone button using Web Speech API
- Share sheet — share preview URL via native share
- Pull-to-refresh on preview panel
- Offline queue for messages

---

## 2. Import GitHub Repos

### UI: "Import Project" flow
In the Project Switcher dropdown, "Import from GitHub" button opens a modal:
1. Paste repo URL (public repos don't need auth)
2. Configure branch and project name
3. "Import" button

### Backend: `POST /projects/import`
```ts
{ repoUrl, branch, name? }
// 1. git clone --depth 1 --branch {branch} {repoUrl}
// 2. bun install
// 3. Auto-detect framework
// 4. Initialize .lovable/ metadata
// 5. Start dev server
// 6. Return { projectId, port, framework }
```

### Backend: `POST /projects/import-github` (authenticated)
Uses GitHub token for private repos.

---

## 3. Supabase Database Connection

### UI: "Connect Supabase" wizard in Cloud panel
Options:
- A: Connect to existing Supabase project (URL + anon key + service role key)
- B: Create new (opens supabase.com)

### Backend: `POST /supabase/connect`
- Validates connection
- Stores encrypted keys in secrets vault
- Generates `src/integrations/supabase/client.ts`
- Generates TypeScript types

### Auto-generated files
```
src/integrations/supabase/
├── client.ts          # createClient with URL + anon key
├── types.ts           # auto-generated from schema
└── hooks/
    ├── useQuery.ts    # wrapper for supabase queries
    └── useRealtime.ts # wrapper for realtime subscriptions
```

### Cloud Panel features
- Tables tab: browse/edit rows
- SQL tab: Monaco SQL editor with results grid
- RLS tab: Row Level Security management
- Types tab: TypeScript types + regenerate button

---

## 4. Multi-Project Management

### Project Switcher
- All projects with name, framework icon, last modified, status
- "+ New Project" → wizard
- "Import from GitHub" → import flow
- Search/filter bar
- Right-click: Rename, Delete, Duplicate

### New Project Wizard
1. Choose template (Blank / With Supabase / From GitHub)
2. Name the project
3. Create → scaffold, install, start dev server

### Backend: Multi-project dev server management
```ts
type ProjectRuntime = {
  projectId: string;
  status: "stopped" | "starting" | "running" | "error";
  port: number;  // 5200-5299
  pid?: number;
  framework: string;
};
```
- One active dev server at a time
- Auto-stop after 30min inactivity

---

## 5. Smart LLM Auto-Router

### Tier system
| Tier | Model | Use case |
|---|---|---|
| fast | claude-haiku-4-5-20251001 | Simple fixes, typos, colors |
| standard | claude-sonnet-4-6-thinking | General coding, new features |
| powerful | claude-opus-4-6-thinking | Complex architecture, refactors |

### Auto-escalation
If a response fails quality checks, automatically retry with the next tier up.

### Model pill in chat
Shows which model was used: ⚡ haiku | 🔵 sonnet | 🟣 opus

---

## 6. Settings Panel

Accessible from toolbar overflow menu:
- Connection: Orchestrator URL
- LLM: Provider selection, model routing, model overrides
- Editor: Font size, theme, tab size, minimap toggle
- Mobile: Touch target size, gesture sensitivity
- About: Version, credits

---

## 7. Command Palette (Cmd+K)

Fuzzy search across:
- Keyboard shortcuts
- Open project by name
- Switch mode
- AI quick actions

---

## 8. Onboarding Flow (first launch)

1. Welcome screen
2. Configure orchestrator URL
3. Choose: New project or Import from GitHub
4. Quick tour overlay (3 steps)
5. Done → lands in chat with first project ready

---

## 9. Environment Variables

```env
# LLM (Quatarly / OpenAI-compatible)
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://api.quatarly.cloud/v1
LLM_ROUTING=auto
LLM_MODEL_FAST=claude-haiku-4-5-20251001
LLM_MODEL_STANDARD=claude-sonnet-4-6-thinking
LLM_MODEL_POWERFUL=claude-opus-4-6-thinking

# Orchestrator
PORT=4000
WORKSPACES_DIR=./workspaces
SECRETS_ENCRYPTION_KEY=your-32-char-encryption-key

# Frontend
VITE_ORCHESTRATOR_URL=http://localhost:4000
```

---

## 10. Getting Started

```bash
git clone https://github.com/kaelynsanford77/love.git
cd love
cp .env.example .env
# Edit .env with your Quatarly API key
bun install
bun run dev
# Open http://localhost:3000
```

### Mobile (PWA)
Open `http://your-server-ip:3000` on your phone.
- iOS: Safari → Share → Add to Home Screen
- Android: Chrome → Menu → Add to Home Screen

### Mobile (Capacitor native)
```bash
cd apps/ide
bun run build
bun run cap:sync
bun run cap:ios   # opens Xcode
bun run cap:android  # opens Android Studio
```
