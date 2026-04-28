# LOVABLE.md — Lovable Solo AI-IDE Specification

**Version:** 1.0.0 | **Updated:** 2026-04-28

Lovable Solo is a self-hosted, full-featured AI-powered IDE inspired by [Lovable](https://lovable.dev). It lets you build web applications from natural language, with a beautiful interface, smart model routing, and everything you need to go from idea to deployment.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOOLBAR (48px) — Project • History • Split | Mode switcher | URL | Share   │
├──────────────────────┬──────────────────────────────────────────────────────┤
│                      │                                                      │
│  CHAT PANEL          │  RIGHT PANEL                                         │
│  380px (resizable)   │  Preview / Code / Files / Cloud / Analytics          │
│                      │                                                      │
│  • Message stream    │                                                      │
│  • Model tier pills  │                                                      │
│  • Tool call cards   │                                                      │
│  • Diff previews     │                                                      │
│  • Input bar         │                                                      │
│                      │                                                      │
├──────────────────────┴──────────────────────────────────────────────────────┤
│  TERMINAL DRAWER (optional)                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Monorepo Structure

```
love/
├── apps/
│   ├── ide/           # (alias: web) React 18 + Vite + Tailwind + shadcn/ui
│   └── orchestrator/  # Bun + Express API server
├── workspaces/        # User project directories
├── LOVABLE.md         # This file
├── .env.example       # Environment template
└── package.json       # Root workspace
```

### Port Allocation

| Service          | Default Port |
|------------------|-------------|
| Frontend (web)   | 5173 (dev)  |
| Orchestrator     | 3001        |
| Project preview  | 3100+       |

---

## Frontend (`apps/web`)

### Tech Stack
- **React 18** + TypeScript
- **Vite** for bundling
- **Tailwind CSS** + shadcn/ui design system
- **Zustand** for global state with localStorage persistence
- **react-resizable-panels** for split panes
- **Monaco Editor** for code editing
- **Recharts** for analytics
- **Sonner** for toast notifications
- **cmdk / CommandPalette** for Cmd+K palette

### Design Tokens

```css
--ide-toolbar-h: 48px
--ide-left-w: 380px
--ide-radius: 10px
--ide-accent: oklch(0.62 0.18 252)   /* Blue */
--background: oklch(0.145 0 0)        /* Near-black */
--foreground: oklch(0.985 0 0)        /* Near-white */
--card: oklch(0.17 0 0)               /* Panel bg */
--border: oklch(0.3 0 0)              /* Dividers */
--muted: oklch(0.22 0 0)              /* Subtle bg */
--primary: oklch(0.62 0.18 252)       /* Accent blue */
```

### Components

#### Toolbar
Full-width 48px bar with:
- **Project Switcher** — dropdown with search/filter, shows current project name
- **History** — git commit timeline
- **Split toggle** — side-by-side mode
- **Mode Switcher** — Preview | Files | Code | Cloud | Analytics
- **More menu** — Terminal, GitHub Import, Database, QR Pairing, Settings
- **Viewport Picker** — Desktop / Tablet 768 / Mobile 375 / Fullscreen
- **Route Bar** — two-way URL input
- **⌘K hint button** — opens command palette
- **Share** + **Publish** buttons

#### Chat Panel
- Message list with markdown rendering
- Model tier pills (🟢 haiku / 🔵 sonnet / 🟣 opus)
- Token/cost/duration tooltip on each message
- Escalation notice ("⬆️ Escalated haiku → sonnet")
- Streaming support (SSE)
- Beautiful empty state with suggestion chips
- ⌘↵ to send, drag-to-attach

#### Preview Panel
- Centered iframe with viewport constraints
- Muted background for desktop/tablet viewports
- HMR auto-updates via Vite dev server

#### Code Panel
- Monaco editor with multi-tab support
- Dirty state indicators
- Auto-save with debounce
- Language detection from file extension
- File tree sidebar (Files mode)

#### Cloud Panel
- Tables browser (data grid)
- SQL editor with syntax highlighting
- RLS Policies tab
- Functions tab

#### Analytics Panel
- Recharts line/bar charts
- Page views + events table

#### Terminal Drawer
- Resizable bottom drawer
- Multi-tab terminal (xterm.js planned)
- Toggle via toolbar or ⌘`

---

## Global Features

### Command Palette (⌘K)
Searchable command list with categories:
- **Navigation** — Go to Preview/Files/Code/Cloud/Analytics
- **Projects** — New Project, Import GitHub, Connect Database
- **Tools** — Terminal, Publish, Share
- **App** — Settings

Keyboard navigation: ↑↓ select, ↵ execute, Esc close.

### Onboarding Flow
First-launch wizard (4 steps):
1. Welcome — feature highlights
2. API Key — enter Quatarly/OpenAI key (with link to get free key)
3. First Project — name + template selector
4. Done — ready to build

Persisted to localStorage. "Skip setup" available.

### Settings Panel
Modal with sidebar navigation:
- **General** — auto-save, orchestrator URL
- **Appearance** — theme (dark/light), font size
- **AI / LLM** — API key, base URL, routing mode, model names per tier
- **Privacy** — telemetry toggle
- **About** — version info, links

### Toast Notifications
Via **Sonner** (bottom-right):
- Success (green): project created, import done, etc.
- Error (red): connection failed, etc.
- Info (blue): offline mode, etc.

### Mobile-First UX
On screens < 768px:
- Bottom navigation bar (Chat | Preview | Code | Cloud | Stats)
- Full-height chat drawer toggled via bottom nav
- Swipe left/right to switch between panels
- QR Pairing modal to open on phone from desktop
- `pb-16` padding to account for native safe area

### Multi-Project Management
- `ProjectSwitcher` dropdown with search + filter
- Shows framework icon, port, creation date per project
- Context menu: Settings, Delete
- **New Project Wizard** — name + template selector (React, Next.js, Vue, Svelte, Landing Page, Dashboard, Express API, Blank)
- **GitHub Import** — clone any public repo, auto-detect framework
- Per-project settings stored in SQLite

### GitHub Import Flow
1. Enter URL (HTTPS, SSH, or `owner/repo` shorthand)
2. Framework auto-detection (Next.js, Vue, Svelte, Angular, Express, React+Vite)
3. Confirm detected settings (framework, package manager, dev command, port)
4. Clone + scaffold project

### Supabase / Database Wizard
1. Choose type: **Supabase** or **PostgreSQL**
2. Enter credentials (URL + anon key for Supabase, connection string for Postgres)
3. Test connection (tries `/rest/v1/` endpoint)
4. Generate `src/lib/supabase.ts` or `src/lib/db.ts` client file
5. Optionally generate TypeScript types at `src/lib/database.types.ts`

Keys stored **base64-encoded** in SQLite (never sent to client).

### Offline Queue
If the browser goes offline:
- Messages are queued in localStorage
- Auto-retried on reconnect (up to 3 retries)
- Indicator shows queued count

---

## Backend (`apps/orchestrator`)

### Tech Stack
- **Node.js / Bun** + **Express**
- **better-sqlite3** for local persistence
- **OpenAI SDK** (works with any OpenAI-compatible API)
- **zod** for input validation
- **express-rate-limit** for request throttling

### Endpoints

#### Health
```
GET /health → { status: "ok", version: "1.0.0" }
```

#### Chat (LLM with auto-routing)
```
POST /chat
  body: { session_id?, messages: [{role, content}] }
  → { turn_id, session_id, content, tier, model, tokens_in, tokens_out, cost_usd, duration_ms, escalated_from? }
```

#### Telemetry
```
GET /telemetry/summary → { byTier: {...}, last50: [...] }
```

#### Projects
```
GET /projects → ProjectInfo[]
POST /projects { name, template?, description? } → ProjectInfo
PATCH /projects/:id { name?, framework?, supabaseUrl?, supabaseAnonKey?, port?, settings? } → ProjectInfo
DELETE /projects/:id → { ok: true }
```

#### GitHub Import
```
POST /github/detect { url } → { framework, packageManager, devCommand, port, name }
POST /github/import { url, name?, framework?, packageManager?, devCommand?, port? } → ProjectInfo
```

#### Supabase
```
POST /supabase/connect { type: "supabase"|"postgres", projectId?, url, anonKey?, serviceKey? } → { ok, clientCode, tables[] }
POST /supabase/types { projectId } → { ok, message }
```

### LLM Auto-Router

Three tiers based on task complexity:

| Tier | Model | When |
|------|-------|------|
| `fast` | `claude-haiku-4-5-20251001` | Typos, renames, color changes, ≤2 file edits |
| `standard` | `claude-sonnet-4-6-thinking` | Default — general coding, new features |
| `powerful` | `claude-opus-4-6-thinking` | Architecture, refactors, >10 files, full apps |

Auto-escalation: `fast → standard → powerful` on QA failure.

### Rate Limits
- `/chat` — 30 req/min
- `/telemetry` — 60 req/min
- `/projects`, `/github`, `/supabase` — 120 req/min

---

## Configuration (`.env`)

```env
# LLM Provider (Quatarly — OpenAI-compatible)
OPENAI_API_KEY=your-quatarly-key
OPENAI_BASE_URL=https://api.quatarly.cloud/v1

# Model routing
LLM_ROUTING=auto          # auto | fixed
LLM_MODEL_FAST=claude-haiku-4-5-20251001
LLM_MODEL_STANDARD=claude-sonnet-4-6-thinking
LLM_MODEL_POWERFUL=claude-opus-4-6-thinking

# Optional — use a single fixed model
# LLM_MODEL=claude-sonnet-4-6-thinking

# Server
PORT=3001
WORKSPACES_DIR=../../workspaces
```

**Get your free Quatarly key:** https://api.quatarly.cloud/api-key

---

## Running Locally

### Prerequisites
- Node.js ≥ 18 or Bun ≥ 1.0
- npm ≥ 9 (or bun)

### Quick Start

```bash
git clone https://github.com/kaelynsanford77/love.git
cd love
cp .env.example .env
# Edit .env — add your API key

npm install
npm run dev:orchestrator   # Terminal 1 (port 3001)
npm run dev:web            # Terminal 2 (port 5173)

# Or if using Bun:
bun install
bun run dev:orchestrator
bun run dev:web
```

Open http://localhost:5173

### Using on Mobile

1. Start dev server as above
2. In the IDE, click the **⋯ More** menu → **Mobile Access (QR)**
3. Scan the QR code with your phone camera
4. Both devices must be on the same Wi-Fi network

---

## Mobile / Capacitor Setup

Capacitor enables running Lovable Solo as a native iOS/Android app.

### Install Capacitor
```bash
cd apps/web
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Lovable Solo" com.lovablesolo.app
```

### Build + Sync
```bash
npm run build
npx cap add ios    # or android
npx cap sync
npx cap open ios   # opens Xcode
```

### Key Capacitor Plugins
- `@capacitor/filesystem` — file system access
- `@capacitor/network` — offline detection
- `@capacitor/haptics` — vibration feedback
- `@capacitor/clipboard` — clipboard access

The app already uses responsive CSS (bottom nav, safe-area-inset) that works natively in Capacitor's WebView.

---

## Templates

| Template | Framework | Dev Command | Port |
|----------|-----------|-------------|------|
| `react-vite` | React + Vite | `npm run dev` | 5173 |
| `nextjs` | Next.js | `npm run dev` | 3000 |
| `vue` | Vue 3 + Vite | `npm run dev` | 5173 |
| `svelte` | SvelteKit | `npm run dev` | 5173 |
| `landing` | React + Vite | `npm run dev` | 5173 |
| `dashboard` | React + Vite | `npm run dev` | 5173 |
| `api` | Express | `node index.js` | 3000 |
| `blank` | — | — | — |

---

## Security Considerations

1. **API keys** — stored in `.env`, never committed. Supabase keys stored base64-encoded in SQLite.
2. **CORS** — Orchestrator allows all origins by default (restrict in production).
3. **Rate limiting** — Applied to all routes.
4. **Input validation** — All API inputs validated with Zod.
5. **Exec safety** — Shell execution routes should validate commands (implement allowlist in production).

---

## Roadmap

- [ ] Streaming SSE for chat (incremental token display)
- [ ] File system routes (read/write/watch via chokidar)
- [ ] Git routes (commit, diff, branch management)
- [ ] Real terminal via xterm.js + pty
- [ ] Publish to Vercel / Netlify / Cloudflare Pages
- [ ] Capacitor iOS/Android build pipeline
- [ ] Plugin system for custom tools
- [ ] Real-time collaboration via CRDTs
- [ ] Vector search for codebase RAG

---

## Contributing

PRs welcome! Please follow existing code style (TypeScript, Prettier, Tailwind).

```bash
git clone https://github.com/kaelynsanford77/love.git
cd love && npm install
git checkout -b feature/my-feature
# make changes
npm run build  # ensure it compiles
git push && open PR
```

---

*Built with ❤️ as an open-source Lovable clone.*
