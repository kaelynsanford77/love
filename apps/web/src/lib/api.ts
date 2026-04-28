import type { Project, FileNode, GitCommit, NpmPackage, ChatTurn } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || ''

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// Projects
export const projectsApi = {
  list: () => apiFetch<Project[]>('/api/projects'),
  get: (id: string) => apiFetch<Project>(`/api/projects/${id}`),
  create: (data: { name: string; description?: string; template?: string }) =>
    apiFetch<Project>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Project>) =>
    apiFetch<Project>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),
}

// File system
export const fsApi = {
  tree: (projectId: string, path = '') =>
    apiFetch<{ tree: FileNode[]; projectPath: string }>(`/api/fs/tree?projectId=${projectId}&path=${encodeURIComponent(path)}`),
  read: (projectId: string, path: string) =>
    apiFetch<{ content: string; mimeType: string; size: number; encoding?: string }>(`/api/fs/read?projectId=${projectId}&path=${encodeURIComponent(path)}`),
  write: (projectId: string, path: string, content: string) =>
    apiFetch<{ success: boolean }>('/api/fs/write', { method: 'POST', body: JSON.stringify({ projectId, path, content }) }),
  delete: (projectId: string, path: string) =>
    apiFetch<{ success: boolean }>('/api/fs/delete', { method: 'DELETE', body: JSON.stringify({ projectId, path }) }),
  mkdir: (projectId: string, path: string) =>
    apiFetch<{ success: boolean }>('/api/fs/mkdir', { method: 'POST', body: JSON.stringify({ projectId, path }) }),
  rename: (projectId: string, oldPath: string, newPath: string) =>
    apiFetch<{ success: boolean }>('/api/fs/rename', { method: 'POST', body: JSON.stringify({ projectId, oldPath, newPath }) }),
  upload: (projectId: string, files: File[], targetPath = 'public') => {
    const formData = new FormData()
    formData.append('projectId', projectId)
    formData.append('targetPath', targetPath)
    files.forEach(f => formData.append('files', f))
    return fetch(`${API_BASE}/api/fs/upload`, { method: 'POST', body: formData }).then(r => r.json())
  },
}

// Git
export const gitApi = {
  log: (projectId: string) =>
    apiFetch<GitCommit[]>(`/api/git/log?projectId=${projectId}`),
  restore: (projectId: string, sha: string) =>
    apiFetch<{ success: boolean }>('/api/git/restore', { method: 'POST', body: JSON.stringify({ projectId, sha }) }),
  fork: (projectId: string, sha: string, branchName?: string) =>
    apiFetch<{ success: boolean; branchName: string }>('/api/git/fork', { method: 'POST', body: JSON.stringify({ projectId, sha, branchName }) }),
  branches: (projectId: string) =>
    apiFetch<{ current: string; branches: string[] }>(`/api/git/branches?projectId=${projectId}`),
  checkout: (projectId: string, branch: string) =>
    apiFetch<{ success: boolean }>('/api/git/checkout', { method: 'POST', body: JSON.stringify({ projectId, branch }) }),
}

// Chat history
export const chatApi = {
  history: (projectId: string) =>
    apiFetch<ChatTurn[]>(`/api/chat/history/${projectId}`),
  clearHistory: (projectId: string) =>
    apiFetch<{ success: boolean }>(`/api/chat/history/${projectId}`, { method: 'DELETE' }),
}

// Chat streaming
export function streamChat(
  projectId: string,
  message: string,
  attachments: any[],
  onEvent: (event: string, data: any) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const combinedSignal = signal || controller.signal

    fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, message, attachments }),
      signal: combinedSignal,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        reject(new Error(err.error))
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventName = line.slice(7).trim()
            const dataLine = lines[lines.indexOf(line) + 1]
            if (dataLine?.startsWith('data: ')) {
              try {
                const data = JSON.parse(dataLine.slice(6))
                onEvent(eventName, data)
              } catch {}
            }
          }
        }
      }
      resolve()
    }).catch(reject)
  })
}

// Exec
export const execApi = {
  run: (projectId: string, command: string) =>
    apiFetch<{ stdout: string; stderr: string; exitCode: number }>('/api/exec', {
      method: 'POST',
      body: JSON.stringify({ projectId, command }),
    }),
}

// NPM
export const npmApi = {
  search: (q: string) =>
    apiFetch<{ packages: NpmPackage[]; total: number }>(`/api/npm/search?q=${encodeURIComponent(q)}`),
  info: (packageName: string) =>
    apiFetch<any>(`/api/npm/info/${encodeURIComponent(packageName)}`),
}

// Usage
export const usageApi = {
  get: (projectId?: string) =>
    apiFetch<any>(`/api/usage${projectId ? `?projectId=${projectId}` : ''}`),
}

// GitHub
export const githubApi = {
  import: (repoUrl: string, name?: string) =>
    apiFetch<Project>('/api/github/import', { method: 'POST', body: JSON.stringify({ repoUrl, name }) }),
}

// Supabase
export const supabaseApi = {
  connect: (projectId: string, supabaseUrl: string, supabaseKey: string) =>
    apiFetch<{ success: boolean }>('/api/supabase/connect', {
      method: 'POST',
      body: JSON.stringify({ projectId, supabaseUrl, supabaseKey }),
    }),
  tables: (projectId: string) =>
    apiFetch<{ tables: string[] }>(`/api/supabase/tables?projectId=${projectId}`),
}

// Preview share
export const previewApi = {
  share: (projectId: string) =>
    apiFetch<{ token: string; url: string }>('/api/preview/share', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),
}
