import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  undone?: boolean;
  gitCommit?: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  framework?: string;
  status?: 'running' | 'stopped' | 'error';
  port?: number;
  template?: string;
}

export interface RuntimeError {
  id: string;
  message: string;
  stack: string;
  url?: string;
  line?: number;
  col?: number;
  timestamp: number;
}

export interface Settings {
  autoSave: boolean;
  orchestratorUrl: string;
  theme: 'dark' | 'light';
  fontSize: number;
  apiKey: string;
  baseUrl: string;
  routingMode: 'auto' | 'fixed';
  modelFast: string;
  modelStandard: string;
  modelPowerful: string;
  telemetry: boolean;
}

const defaultSettings: Settings = {
  autoSave: true,
  orchestratorUrl: 'http://localhost:4000',
  theme: 'dark',
  fontSize: 14,
  apiKey: '',
  baseUrl: 'https://api.quatarly.cloud/v1',
  routingMode: 'auto',
  modelFast: 'claude-haiku-4-5-20251001',
  modelStandard: 'claude-sonnet-4-6-thinking',
  modelPowerful: 'claude-opus-4-6-thinking',
  telemetry: false,
};

interface Store {
  projectId: string;
  mode: Mode;
  viewport: Viewport;
  route: string;
  splitView: boolean;
  tabs: Tab[];
  activeTab: string | null;
  runtimeStatus: 'running' | 'stopped' | 'error';
  projects: ProjectInfo[];
  messages: ChatMessage[];
  isStreaming: boolean;

  // New state
  onboardingComplete: boolean;
  settings: Settings;
  supabaseConnected: boolean;
  supabaseConfig: { url: string; anonKey: string } | null;
  inspectMode: boolean;
  errors: RuntimeError[];
  commandPaletteOpen: boolean;

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
  setProjects: (projects: ProjectInfo[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (patch: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setIsStreaming: (v: boolean) => void;

  // New actions
  setOnboardingComplete: (v: boolean) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setSupabaseConnected: (v: boolean) => void;
  setSupabaseConfig: (config: { url: string; anonKey: string } | null) => void;
  setInspectMode: (v: boolean) => void;
  addError: (err: Omit<RuntimeError, 'id' | 'timestamp'>) => void;
  clearErrors: () => void;
  setCommandPaletteOpen: (v: boolean) => void;
  undoMessage: (id: string) => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
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
      onboardingComplete: false,
      settings: defaultSettings,
      supabaseConnected: false,
      supabaseConfig: null,
      inspectMode: false,
      errors: [],
      commandPaletteOpen: false,

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

      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      setSupabaseConnected: (supabaseConnected) => set({ supabaseConnected }),
      setSupabaseConfig: (supabaseConfig) => set({ supabaseConfig }),
      setInspectMode: (inspectMode) => set({ inspectMode }),
      addError: (err) =>
        set((s) => ({
          errors: [
            ...s.errors.slice(-4),
            { ...err, id: crypto.randomUUID(), timestamp: Date.now() },
          ],
        })),
      clearErrors: () => set({ errors: [] }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      undoMessage: (id) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, undone: true } : m
          ),
        })),
    }),
    {
      name: 'lovable-solo-store',
      partialize: (s) => ({
        onboardingComplete: s.onboardingComplete,
        settings: s.settings,
        supabaseConnected: s.supabaseConnected,
        supabaseConfig: s.supabaseConfig,
        projectId: s.projectId,
      }),
    }
  )
);
