import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface EditorTab {
  id: string;
  projectId: string;
  filePath: string;
  content: string;
  isDirty: boolean;
  language: string;
}

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  fontSize: number;
  theme: "vs-dark" | "vs-light";
  minimap: boolean;
  wordWrap: boolean;
  tabSize: number;

  openFile: (projectId: string, filePath: string, content: string) => void;
  closeTab: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  markSaved: (id: string) => void;
  setActiveTab: (id: string) => void;
  setFontSize: (size: number) => void;
  setTheme: (theme: "vs-dark" | "vs-light") => void;
  setMinimap: (v: boolean) => void;
  setWordWrap: (v: boolean) => void;
  setTabSize: (v: number) => void;
}

function getLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    css: "css", html: "html", json: "json", md: "markdown",
    py: "python", sh: "shell", yaml: "yaml", yml: "yaml",
    toml: "toml", sql: "sql", rs: "rust", go: "go",
  };
  return map[ext || ""] || "plaintext";
}

export const useEditorStore = create<EditorState>()(
  persist(
    immer((set, get) => ({
      tabs: [],
      activeTabId: null,
      fontSize: 14,
      theme: "vs-dark",
      minimap: false,
      wordWrap: false,
      tabSize: 2,

      openFile: (projectId, filePath, content) => {
        const existing = get().tabs.find(
          (t) => t.projectId === projectId && t.filePath === filePath
        );
        if (existing) {
          set((s) => { s.activeTabId = existing.id; });
          return;
        }
        const id = crypto.randomUUID();
        set((s) => {
          s.tabs.push({
            id, projectId, filePath, content,
            isDirty: false,
            language: getLanguage(filePath),
          });
          s.activeTabId = id;
        });
      },

      closeTab: (id) => {
        set((s) => {
          const idx = s.tabs.findIndex((t) => t.id === id);
          s.tabs.splice(idx, 1);
          if (s.activeTabId === id) {
            s.activeTabId = s.tabs[Math.max(0, idx - 1)]?.id || null;
          }
        });
      },

      updateContent: (id, content) =>
        set((s) => {
          const tab = s.tabs.find((t) => t.id === id);
          if (tab) { tab.content = content; tab.isDirty = true; }
        }),

      markSaved: (id) =>
        set((s) => {
          const tab = s.tabs.find((t) => t.id === id);
          if (tab) tab.isDirty = false;
        }),

      setActiveTab: (id) => set((s) => { s.activeTabId = id; }),
      setFontSize: (size) => set((s) => { s.fontSize = size; }),
      setTheme: (theme) => set((s) => { s.theme = theme; }),
      setMinimap: (v) => set((s) => { s.minimap = v; }),
      setWordWrap: (v) => set((s) => { s.wordWrap = v; }),
      setTabSize: (v) => set((s) => { s.tabSize = v; }),
    })),
    {
      name: "lovable-editor",
      partialize: (s) => ({
        fontSize: s.fontSize,
        theme: s.theme,
        minimap: s.minimap,
        wordWrap: s.wordWrap,
        tabSize: s.tabSize,
      }),
    }
  )
);
