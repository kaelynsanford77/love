export function randomUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatRelativeTime(date: string): string {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function getFrameworkIcon(framework: string): string {
  const icons: Record<string, string> = {
    nextjs: "▲",
    react: "⚛",
    "react-vite": "⚡",
    nuxt: "💚",
    sveltekit: "🔥",
    remix: "💿",
    astro: "🚀",
    nodejs: "🟢",
    unknown: "📦",
  };
  return icons[framework] ?? "📦";
}

export function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    css: "css",
    scss: "scss",
    html: "html",
    json: "json",
    md: "markdown",
    py: "python",
    go: "go",
    rs: "rust",
    java: "java",
    sh: "shell",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    env: "shell",
  };
  return map[ext] ?? "plaintext";
}
