export type ModelTier = "fast" | "standard" | "powerful";

export interface Project {
  id: string;
  name: string;
  framework: string;
  githubRemote?: string;
  supabaseUrl?: string;
  devPort?: number;
  status: "idle" | "running" | "stopped" | "error";
  lastModified: string;
  createdAt: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  modelTier?: ModelTier;
  modelName?: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  status?: "streaming" | "done" | "error";
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: "pending" | "running" | "done" | "error";
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  content?: string;
  dirty?: boolean;
  language?: string;
}

export interface DevServer {
  projectId: string;
  port: number;
  pid: number;
  status: "starting" | "running" | "stopped" | "error";
  url: string;
  startedAt: string;
}

export interface SupabaseConnection {
  projectId: string;
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  connected: boolean;
  tables?: SupabaseTable[];
}

export interface SupabaseTable {
  name: string;
  schema: string;
  columns: SupabaseColumn[];
  rowCount?: number;
}

export interface SupabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue?: string;
}

export interface ImportConfig {
  repoUrl: string;
  branch: string;
  name?: string;
}

export interface LLMConfig {
  routing: "auto" | "fixed";
  fixedModel?: string;
  fastModel: string;
  standardModel: string;
  powerfulModel: string;
  baseUrl: string;
  apiKey?: string;
}

export interface AppSettings {
  llm: LLMConfig;
  editor: {
    fontSize: number;
    theme: "dark" | "light";
    tabSize: number;
    wordWrap: boolean;
    minimap: boolean;
  };
  preview: {
    autoRefresh: boolean;
    showDevTools: boolean;
  };
  git: {
    defaultBranch: string;
    autoCommit: boolean;
    commitMessage: string;
  };
  mobile: {
    enableCapacitor: boolean;
    pushNotifications: boolean;
  };
}
