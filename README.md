# Lovable IDE — AI-Powered Development Environment

A full-featured AI-powered IDE clone built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

## Features

All 16 high-impact features implemented:

| Feature | Description |
|---------|-------------|
| 🖱️ **Click-to-edit preview** | Hover element in preview → blue outline → click → opens exact JSX line in editor |
| 📸 **Screenshot/image to code** | Paste screenshot in chat → AI generates matching UI |
| 🔴 **Runtime error forwarding** | Console errors from preview appear as red banners in chat with "Fix this" button |
| 📦 **Visual package manager** | Search/install npm packages from UI with visual feedback |
| 🖼️ **Asset manager** | Drag images into file tree, auto-saved to public/ |
| 🔄 **Chat-level undo/redo** | "Undo last AI change" button per message with snapshot restore |
| 🌐 **Shareable preview links** | One-click "Share preview" → generates public URL |
| 🎨 **shadcn component browser** | Browse/preview/insert shadcn components visually |
| 📋 **URL-to-clone** | Paste any website URL → AI clones the design |
| 🔍 **Network + Console inspector** | See all fetch requests + console.log from preview in IDE |
| ⚡ **Lighthouse/perf scores** | One-click performance audit with "Fix with AI" buttons |
| ♿ **Accessibility checker** | axe-core scan with "Fix violations" AI button |
| 🎯 **AI context attachments** | Attach files, URLs, images to any chat message as context |
| 🔀 **Fork from any history point** | Branch from any git snapshot, not just restore |
| 📱 **Responsive preview comparison** | See desktop + tablet + mobile side-by-side |
| 🤖 **Sub-agents (QA, Security)** | Auto-run typecheck/lint after every AI turn, show results |

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Monaco Editor** for code editing
- **Zustand** for state management
- **Radix UI** for accessible primitives