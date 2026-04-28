# Lovable Solo — AI-Powered IDE

A full-featured AI-IDE clone built with React, TypeScript, Vite, and Tailwind CSS.

## Features

| Feature | Description |
|---------|-------------|
| 🧵 Multi-chat threads | Multiple conversation threads per project (e.g. "UI thread" + "backend thread") |
| 💡 AI follow-up suggestions | After each AI turn, 3 clickable suggestion chips appear |
| 🌱 Database seed generator | "Generate test data" button in Cloud panel creates realistic seed SQL |
| 🔑 Env var manager UI | Visual .env editor — add/edit/toggle vars without touching files |
| 📐 Drag-to-resize all panels | Resizable chat width, terminal height, code/preview split ratio |
| 🧩 Tailwind class autocomplete | Describe style → get Tailwind class suggestions |
| 🔗 Deep link any state | URL encodes current mode+file+route for bookmarking |
| 📊 Token usage dashboard | Tokens/day, cost/day, model breakdown chart |

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Recharts (for token dashboard)
- Lucide React (icons)
