import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface AppSettings {
  // Connection
  orchestratorUrl: string;
  apiToken: string;

  // LLM
  llmRouting: "auto" | "fixed";
  llmModelFast: string;
  llmModelStandard: string;
  llmModelPowerful: string;

  // Preview
  defaultViewport: "mobile" | "tablet" | "desktop";
  autoReload: boolean;

  // Git
  autoCommit: boolean;
  commitMessageFormat: string;

  // Mobile
  touchTargetSize: number;
  gestureSensitivity: number;

  // Onboarding
  onboardingComplete: boolean;
  firstLaunch: boolean;
}

interface SettingsState extends AppSettings {
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setMany: (updates: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      orchestratorUrl: import.meta.env.VITE_ORCHESTRATOR_URL || "http://localhost:4000",
      apiToken: "",
      llmRouting: "auto",
      llmModelFast: "claude-haiku-4-5-20251001",
      llmModelStandard: "claude-sonnet-4-6-thinking",
      llmModelPowerful: "claude-opus-4-6-thinking",
      defaultViewport: "desktop",
      autoReload: true,
      autoCommit: false,
      commitMessageFormat: "AI: {summary}",
      touchTargetSize: 44,
      gestureSensitivity: 0.5,
      onboardingComplete: false,
      firstLaunch: true,

      set: (key, value) => set((s) => { (s as any)[key] = value; }),
      setMany: (updates) => set((s) => { Object.assign(s, updates); }),
    })),
    { name: "lovable-settings" }
  )
);
