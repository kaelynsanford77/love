import { useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useEditorStore } from "@/stores/editorStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface EditorStoreSnapshot {
  fontSize: number;
  theme: "vs-dark" | "vs-light";
  minimap: boolean;
  wordWrap: boolean;
  tabSize: number;
  setFontSize: (n: number) => void;
  setTheme: (t: "vs-dark" | "vs-light") => void;
  setMinimap: (v: boolean) => void;
  setWordWrap: (v: boolean) => void;
  setTabSize: (v: number) => void;
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

type SettingsTab = "connection" | "llm" | "editor" | "mobile" | "about";

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
  { id: "connection", label: "Connection", icon: "🔌" },
  { id: "llm", label: "LLM", icon: "🧠" },
  { id: "editor", label: "Editor", icon: "✏️" },
  { id: "mobile", label: "Mobile", icon: "📱" },
  { id: "about", label: "About", icon: "ℹ️" },
];

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("connection");
  const settings = useSettingsStore();
  const editorStore = useEditorStore();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex animate-slide-up relative">
        {/* Sidebar */}
        <div className="w-44 border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex flex-col">
          <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Settings</h2>
          </div>
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors min-h-[44px]",
                activeTab === id
                  ? "bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-400 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800"
              )}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✕
          </button>

          {activeTab === "connection" && <ConnectionSettings />}
          {activeTab === "llm" && <LLMSettings />}
          {activeTab === "editor" && <EditorSettings editorStore={editorStore} />}
          {activeTab === "mobile" && <MobileSettings />}
          {activeTab === "about" && <AboutTab />}
        </div>
      </div>
    </div>
  );
}

function SettingsInput({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>
  );
}

function SettingsToggle({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
        {description && <div className="text-xs text-gray-500">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "w-10 h-5 rounded-full transition-colors relative shrink-0",
          checked ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
          checked && "translate-x-5"
        )} />
      </button>
    </div>
  );
}

function ConnectionSettings() {
  const settings = useSettingsStore();
  const [url, setUrl] = useState(settings.orchestratorUrl);
  const handleSave = () => {
    settings.set("orchestratorUrl", url);
    toast.success("Settings saved");
  };
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Connection</h3>
      <SettingsInput
        label="Orchestrator URL"
        value={url}
        onChange={setUrl}
        placeholder="http://localhost:4000"
      />
      <p className="text-xs text-gray-500">
        The URL of your backend orchestrator. Use this to connect to a remote VPS instance.
      </p>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-medium"
      >
        Save
      </button>
    </div>
  );
}

function LLMSettings() {
  const settings = useSettingsStore();
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">LLM Configuration</h3>

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Routing Mode</label>
        <div className="flex gap-2">
          {(["auto", "fixed"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => settings.set("llmRouting", mode)}
              className={cn(
                "px-3 py-2 text-sm rounded-lg border-2 transition-colors font-medium",
                settings.llmRouting === mode
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              {mode === "auto" ? "🧠 Auto" : "🔒 Fixed"}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Auto mode picks the best model based on task complexity.
        </p>
      </div>

      <SettingsInput
        label="⚡ Fast model (simple tasks)"
        value={settings.llmModelFast}
        onChange={(v) => settings.set("llmModelFast", v)}
        placeholder="claude-haiku-4-5-20251001"
      />
      <SettingsInput
        label="🔵 Standard model (general coding)"
        value={settings.llmModelStandard}
        onChange={(v) => settings.set("llmModelStandard", v)}
        placeholder="claude-sonnet-4-6-thinking"
      />
      <SettingsInput
        label="🟣 Powerful model (complex tasks)"
        value={settings.llmModelPowerful}
        onChange={(v) => settings.set("llmModelPowerful", v)}
        placeholder="claude-opus-4-6-thinking"
      />

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-400">
        💡 Using Quatarly? Set your API key in the orchestrator&apos;s <code>.env</code> file as <code>OPENAI_API_KEY</code> with <code>OPENAI_BASE_URL=https://api.quatarly.cloud/v1</code>
      </div>

      <button
        onClick={() => toast.success("LLM settings saved")}
        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-medium"
      >
        Save
      </button>
    </div>
  );
}

function EditorSettings({ editorStore }: { editorStore: EditorStoreSnapshot }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Editor</h3>

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Font Size: {editorStore.fontSize}px</label>
        <input
          type="range"
          min={10}
          max={20}
          value={editorStore.fontSize}
          onChange={(e) => editorStore.setFontSize(Number(e.target.value))}
          className="w-full accent-purple-600"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Theme</label>
        <div className="flex gap-2">
          {(["vs-dark", "vs-light"] as const).map((t) => (
            <button
              key={t}
              onClick={() => editorStore.setTheme(t)}
              className={cn(
                "px-3 py-2 text-sm rounded-lg border-2 transition-colors font-medium",
                editorStore.theme === t
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              {t === "vs-dark" ? "🌙 Dark" : "☀️ Light"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tab Size: {editorStore.tabSize}</label>
        <div className="flex gap-2">
          {[2, 4].map((s) => (
            <button
              key={s}
              onClick={() => editorStore.setTabSize(s)}
              className={cn(
                "px-3 py-2 text-sm rounded-lg border-2 transition-colors font-medium",
                editorStore.tabSize === s
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              {s} spaces
            </button>
          ))}
        </div>
      </div>

      <SettingsToggle
        label="Minimap"
        description="Show the code minimap on the right"
        checked={editorStore.minimap}
        onChange={editorStore.setMinimap}
      />
      <SettingsToggle
        label="Word Wrap"
        checked={editorStore.wordWrap}
        onChange={editorStore.setWordWrap}
      />
    </div>
  );
}

function MobileSettings() {
  const settings = useSettingsStore();
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Mobile</h3>
      <p className="text-sm text-gray-500">
        Lovable Solo works as a mobile-first Progressive Web App. Install it from your browser to use it as a native app.
      </p>
      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-xs text-purple-700 dark:text-purple-400">
        📱 On iOS: Safari → Share → Add to Home Screen<br/>
        🤖 On Android: Chrome → Menu → Add to Home Screen
      </div>
      <SettingsToggle
        label="Large touch targets"
        description="Use 44px+ touch targets (Apple HIG)"
        checked={settings.touchTargetSize >= 44}
        onChange={(v) => settings.set("touchTargetSize", v ? 44 : 36)}
      />
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Gesture Sensitivity: {(settings.gestureSensitivity * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.gestureSensitivity * 100}
          onChange={(e) => settings.set("gestureSensitivity", Number(e.target.value) / 100)}
          className="w-full accent-purple-600"
        />
      </div>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center text-white text-xl font-bold">
          ✦
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Lovable Solo</h3>
          <p className="text-xs text-gray-500">Version 1.0.0</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Your personal AI-powered IDE. Build web apps from anywhere — desktop or mobile — using state-of-the-art LLMs.
      </p>
      <div className="space-y-2 text-sm">
        <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
          GitHub Repository →
        </a>
      </div>
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-400">
          Built with React, Vite, Tailwind CSS, Monaco Editor, Hono, and Bun.
          LLMs powered by Quatarly (Claude, Gemini, GPT).
        </p>
      </div>
    </div>
  );
}
