export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestions?: string[];
}

export interface ChatThread {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
}

export interface EnvVar {
  key: string;
  value: string;
  enabled: boolean;
}

export interface TokenUsage {
  date: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
}

export interface PanelSizes {
  chatWidth: number;
  terminalHeight: number;
  codeSplitRatio: number;
}

export interface DeepLinkState {
  mode: 'chat' | 'code' | 'preview' | 'cloud' | 'env' | 'tokens';
  file?: string;
  line?: number;
}

export interface AppState {
  threads: ChatThread[];
  activeThreadId: string | null;
  envVars: EnvVar[];
  tokenUsage: TokenUsage[];
  panelSizes: PanelSizes;
  deepLink: DeepLinkState;
  seedSql: string;
}
