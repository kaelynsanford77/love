import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { api } from "@/lib/api";

export interface Project {
  id: string;
  name: string;
  description: string;
  framework: string;
  port: number;
  status: "stopped" | "starting" | "running" | "error";
  pid?: number;
  github_remote?: string;
  supabase_project_id?: string;
  created_at: number;
  updated_at: number;
  last_activity?: number;
}

export type PanelMode = "chat" | "preview" | "code" | "cloud" | "analytics";

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  panelMode: PanelMode;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (name: string, template?: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  activateProject: (id: string) => Promise<void>;
  importProject: (repoUrl: string, branch?: string, name?: string) => Promise<Project>;
  setActiveProject: (id: string | null) => void;
  setPanelMode: (mode: PanelMode) => void;
  updateProjectStatus: (id: string, status: Project["status"]) => void;
  getActiveProject: () => Project | null;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    immer((set, get) => ({
      projects: [],
      activeProjectId: null,
      panelMode: "chat",
      isLoading: false,
      error: null,

      fetchProjects: async () => {
        set((s) => { s.isLoading = true; s.error = null; });
        try {
          const { projects } = await api.get<{ projects: Project[] }>("/projects");
          set((s) => { s.projects = projects; s.isLoading = false; });
        } catch (e) {
          set((s) => { s.error = String(e); s.isLoading = false; });
        }
      },

      createProject: async (name, template = "blank") => {
        const { project } = await api.post<{ project?: Project } & Project>("/projects", { name, template });
        const p: Project = (project as Project) || ({ name, framework: "vite-react", status: "starting" } as any);
        set((s) => { if (p.id) s.projects.unshift(p); });
        return p;
      },

      deleteProject: async (id) => {
        await api.delete(`/projects/${id}`);
        set((s) => {
          s.projects = s.projects.filter((p) => p.id !== id);
          if (s.activeProjectId === id) s.activeProjectId = s.projects[0]?.id || null;
        });
      },

      renameProject: async (id, name) => {
        await api.patch(`/projects/${id}`, { name });
        set((s) => {
          const p = s.projects.find((p) => p.id === id);
          if (p) p.name = name;
        });
      },

      duplicateProject: async (id) => {
        await api.post<{ id: string }>(`/projects/${id}/duplicate`);
        await get().fetchProjects();
      },

      activateProject: async (id) => {
        set((s) => { s.activeProjectId = id; });
        try {
          await api.post(`/projects/${id}/activate`);
        } catch {}
        set((s) => {
          const p = s.projects.find((p) => p.id === id);
          if (p) p.status = "starting";
        });
      },

      importProject: async (repoUrl, branch = "main", name?) => {
        const result = await api.post<{ projectId: string; framework: string; port: number; status: string }>(
          "/projects/import",
          { repoUrl, branch, name }
        );
        await get().fetchProjects();
        const p = get().projects.find((p) => p.id === result.projectId);
        return p!;
      },

      setActiveProject: (id) => set((s) => { s.activeProjectId = id; }),

      setPanelMode: (mode) => set((s) => { s.panelMode = mode; }),

      updateProjectStatus: (id, status) =>
        set((s) => {
          const p = s.projects.find((p) => p.id === id);
          if (p) p.status = status;
        }),

      getActiveProject: () => {
        const { projects, activeProjectId } = get();
        return projects.find((p) => p.id === activeProjectId) || null;
      },
    })),
    {
      name: "lovable-projects",
      partialize: (s) => ({ activeProjectId: s.activeProjectId, panelMode: s.panelMode }),
    }
  )
);
