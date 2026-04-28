import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export const FRAMEWORK_ICONS: Record<string, string> = {
  "vite-react": "⚛️",
  nextjs: "▲",
  sveltekit: "🧡",
  nuxt: "💚",
  vue: "💚",
  react: "⚛️",
  unknown: "📦",
};

export const FRAMEWORK_LABELS: Record<string, string> = {
  "vite-react": "Vite + React",
  nextjs: "Next.js",
  sveltekit: "SvelteKit",
  nuxt: "Nuxt",
  vue: "Vue",
  react: "React",
  unknown: "Unknown",
};
