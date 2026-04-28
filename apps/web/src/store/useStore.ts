import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  port?: number;
  framework?: string;
  createdAt: string;
  description?: string;
  template?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  githubRepo?: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  autoSave: boolean;
  telemetryEnabled: boolean;
  orchestratorUrl: string;
  llmRouting: 'auto' | 'fixed';
  llmModelFast: string;
  llmModelStandard: string;
  llmModelPowerful: string;
  apiKey: string;
  apiBaseUrl: string;
}

export interface AppState {
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (v: boolean) => void;

  projects: ProjectInfo[];
  currentProjectId: string | null;
  setProjects: (projects: ProjectInfo[]) => void;
  setCurrentProjectId: (id: string | null) => void;
  addProject: (project: ProjectInfo) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<ProjectInfo>) => void;

  commandPaletteOpen: boolean;
  settingsOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;

  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  autoSave: true,
  telemetryEnabled: true,
  orchestratorUrl: 'http://localhost:3001',
  llmRouting: 'auto',
  llmModelFast: 'claude-haiku-4-5-20251001',
  llmModelStandard: 'claude-sonnet-4-6-thinking',
  llmModelPowerful: 'claude-opus-4-6-thinking',
  apiKey: '',
  apiBaseUrl: 'https://api.quatarly.cloud/v1',
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (v) => set({ hasSeenOnboarding: v }),

      projects: [],
      currentProjectId: null,
      setProjects: (projects) => set({ projects }),
      setCurrentProjectId: (id) => set({ currentProjectId: id }),
      addProject: (project) =>
        set((s) => ({ projects: [...s.projects, project] })),
      removeProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          currentProjectId: s.currentProjectId === id ? null : s.currentProjectId,
        })),
      updateProject: (id, updates) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      commandPaletteOpen: false,
      settingsOpen: false,
      setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
      setSettingsOpen: (v) => set({ settingsOpen: v }),

      settings: DEFAULT_SETTINGS,
      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),
    }),
    {
      name: 'love-app-state',
      partialize: (s) => ({
        hasSeenOnboarding: s.hasSeenOnboarding,
        projects: s.projects,
        currentProjectId: s.currentProjectId,
        settings: s.settings,
      }),
    },
  ),
);
