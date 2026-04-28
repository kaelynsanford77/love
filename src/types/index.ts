export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  snapshotId?: string; // git snapshot for undo
  error?: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'url';
  name: string;
  content: string; // base64 for images, text for files, url string
  mimeType?: string;
}

export interface RuntimeError {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  source?: string;
  line?: number;
  column?: number;
}

export interface ConsoleEntry {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  args: string[];
  timestamp: number;
}

export interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  duration?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  timestamp: number;
}

export interface NpmPackage {
  name: string;
  version: string;
  description: string;
  installed?: boolean;
}

export interface GitSnapshot {
  id: string;
  message: string;
  timestamp: number;
  files: Record<string, string>; // path -> content
}

export interface ShadcnComponent {
  name: string;
  description: string;
  category: string;
  preview: string; // JSX string
  code: string; // import + usage code
}

export interface LighthouseScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  diagnostics: string[];
}

export interface AccessibilityViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: { html: string; target: string[] }[];
}

export interface SubAgentResult {
  agent: 'typecheck' | 'lint' | 'security' | 'qa';
  status: 'pass' | 'fail' | 'warning';
  issues: { message: string; file?: string; line?: number; severity: string }[];
  timestamp: number;
}

export type PreviewSize = 'desktop' | 'tablet' | 'mobile';

export interface PreviewSizeConfig {
  name: PreviewSize;
  width: number;
  height: number;
  icon: string;
}

export const PREVIEW_SIZES: PreviewSizeConfig[] = [
  { name: 'desktop', width: 1440, height: 900, icon: 'Monitor' },
  { name: 'tablet', width: 768, height: 1024, icon: 'Tablet' },
  { name: 'mobile', width: 375, height: 812, icon: 'Smartphone' },
];
