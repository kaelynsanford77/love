import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) return date.toLocaleDateString()
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const icons: Record<string, string> = {
    ts: '🔷', tsx: '⚛️', js: '🟨', jsx: '⚛️',
    json: '📋', md: '📝', css: '🎨', html: '🌐',
    svg: '🎭', png: '🖼️', jpg: '🖼️', jpeg: '🖼️',
    gif: '🎞️', webp: '🖼️', ico: '🔵',
    txt: '📄', env: '⚙️', yml: '⚙️', yaml: '⚙️',
    sh: '💻', gitignore: '🙈', lock: '🔒',
  }
  return icons[ext] || '📄'
}

export function getLanguageFromExt(ext: string): string {
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescriptreact',
    js: 'javascript', jsx: 'javascriptreact',
    json: 'json', md: 'markdown', css: 'css',
    html: 'html', xml: 'xml', yaml: 'yaml', yml: 'yaml',
    sh: 'shell', bash: 'shell', py: 'python',
    rs: 'rust', go: 'go', java: 'java', cpp: 'cpp',
    c: 'c', sql: 'sql', graphql: 'graphql',
  }
  return map[ext] || 'plaintext'
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}
