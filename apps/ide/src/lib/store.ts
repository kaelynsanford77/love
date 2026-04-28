import { create } from 'zustand';

export type Mode = 'preview' | 'files' | 'code' | 'cloud' | 'analytics';
export type Viewport = 'desktop' | 'tablet' | 'mobile' | 'fullscreen';

export interface Tab {
  path: string;
  dirty: boolean;
  content: string;
  language?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: string;
  timestamp: number;
  streaming?: boolean;
}

interface Store {
  projectId: string;
  mode: Mode;
  viewport: Viewport;
  route: string;
  splitView: boolean;
  tabs: Tab[];
  activeTab: string | null;
  runtimeStatus: 'running' | 'stopped' | 'error';
  projects: string[];
  messages: ChatMessage[];
  isStreaming: boolean;

  // Actions
  setMode: (mode: Mode) => void;
  setViewport: (viewport: Viewport) => void;
  setRoute: (route: string) => void;
  toggleSplit: () => void;
  setProjectId: (id: string) => void;
  openTab: (path: string, content: string, language?: string) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  markDirty: (path: string) => void;
  updateTabContent: (path: string, content: string) => void;
  setRuntimeStatus: (status: 'running' | 'stopped' | 'error') => void;
  setProjects: (projects: string[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (patch: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setIsStreaming: (v: boolean) => void;
}

export const useStore = create<Store>((set) => ({
  projectId: 'default',
  mode: 'preview',
  viewport: 'desktop',
  route: '/',
  splitView: false,
  tabs: [],
  activeTab: null,
  runtimeStatus: 'stopped',
  projects: [],
  messages: [],
  isStreaming: false,

  setMode: (mode) => set({ mode }),
  setViewport: (viewport) => set({ viewport }),
  setRoute: (route) => set({ route }),
  toggleSplit: () => set((s) => ({ splitView: !s.splitView })),
  setProjectId: (projectId) => set({ projectId, tabs: [], activeTab: null, messages: [] }),

  openTab: (path, content, language) =>
    set((s) => ({
      tabs: s.tabs.find((t) => t.path === path)
        ? s.tabs
        : [...s.tabs, { path, dirty: false, content, language }],
      activeTab: path,
    })),

  closeTab: (path) =>
    set((s) => {
      const remaining = s.tabs.filter((t) => t.path !== path);
      const newActive =
        s.activeTab === path ? (remaining[remaining.length - 1]?.path ?? null) : s.activeTab;
      return { tabs: remaining, activeTab: newActive };
    }),

  setActiveTab: (path) => set({ activeTab: path }),

  markDirty: (path) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.path === path ? { ...t, dirty: true } : t)),
    })),

  updateTabContent: (path, content) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.path === path ? { ...t, content, dirty: true } : t)),
    })),

  setRuntimeStatus: (runtimeStatus) => set({ runtimeStatus }),
  setProjects: (projects) => set({ projects }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  updateLastMessage: (patch) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const msgs = [...s.messages];
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...patch };
      return { messages: msgs };
    }),

  clearMessages: () => set({ messages: [] }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
}));
