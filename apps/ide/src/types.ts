export type ModelTier = "fast" | "standard" | "powerful";
export type ActiveMode = "chat" | "preview" | "code" | "cloud";

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
  filesChanged?: string[];
  status?: "streaming" | "done" | "error";
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  content?: string;
  dirty?: boolean;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
}
