export interface Project {
  id: string
  name: string
  path: string
  description: string
  created_at: string
  updated_at: string
  git_sha: string
  supabase_url?: string
  supabase_key?: string
  github_repo?: string
}

export interface ChatTurn {
  id: string
  project_id: string
  role: 'user' | 'assistant'
  content: string
  model?: string
  tokens_in: number
  tokens_out: number
  cost_usd: number
  git_sha?: string
  created_at: string
  attachments?: string
  turn_index: number
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  ext?: string
  mimeType?: string
  size?: number
  children?: FileNode[]
}

export interface GitCommit {
  hash: string
  message: string
  date: string
  author: string
  refs: string
}

export interface NpmPackage {
  name: string
  version: string
  description: string
  keywords?: string[]
  score?: any
}

export interface ChatEvent {
  type: 'model' | 'thinking' | 'text' | 'tool_call' | 'tool_result' | 'commit' | 'qa' | 'done' | 'error'
  data: any
}

export type ViewMode = 'chat' | 'code' | 'preview'
