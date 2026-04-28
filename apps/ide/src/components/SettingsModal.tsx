import React, { useState, useEffect } from "react";
import { X, Loader2, Settings, Cpu, Code2, Eye, GitBranch, Smartphone, Info, Save } from "lucide-react";
import type { Toast } from "../types";
import { getSettings, updateSettings } from "../api";
import { cn } from "../utils";

interface SettingsModalProps {
  onClose: () => void;
  onToast: (toast: Omit<Toast, "id">) => void;
}

type Section = "llm" | "editor" | "preview" | "git" | "mobile" | "about";

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "llm", label: "LLM Config", icon: <Cpu size={14} /> },
  { id: "editor", label: "Editor", icon: <Code2 size={14} /> },
  { id: "preview", label: "Preview", icon: <Eye size={14} /> },
  { id: "git", label: "Git", icon: <GitBranch size={14} /> },
  { id: "mobile", label: "Mobile", icon: <Smartphone size={14} /> },
  { id: "about", label: "About", icon: <Info size={14} /> },
];

export function SettingsModal({ onClose, onToast }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<Section>("llm");
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => onToast({ type: "error", title: "Could not load settings" }));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings(settings);
      onToast({ type: "success", title: "Settings saved!" });
    } catch {
      onToast({ type: "error", title: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const set = (path: string[], value: unknown) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      let obj: Record<string, unknown> = next;
      for (let i = 0; i < path.length - 1; i++) {
        obj[path[i]] = { ...(obj[path[i]] as Record<string, unknown>) };
        obj = obj[path[i]] as Record<string, unknown>;
      }
      obj[path[path.length - 1]] = value;
      return next;
    });
  };

  const llm = (settings?.llm as Record<string, unknown>) ?? {};
  const editor = (settings?.editor as Record<string, unknown>) ?? {};
  const preview = (settings?.preview as Record<string, unknown>) ?? {};
  const git = (settings?.git as Record<string, unknown>) ?? {};
  const mobile = (settings?.mobile as Record<string, unknown>) ?? {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl h-[560px] bg-[#1a1a1d] rounded-2xl border border-[#2d2d32] shadow-2xl overflow-hidden animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2d32] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-[#9898a5]" />
            <h2 className="text-base font-semibold text-white">Settings</h2>
          </div>
          <button onClick={onClose} className="text-[#9898a5] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-40 border-r border-[#2d2d32] py-2 flex-shrink-0">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors",
                  activeSection === s.id
                    ? "text-white bg-[#242428]"
                    : "text-[#9898a5] hover:text-white hover:bg-[#1e1e21]"
                )}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {!settings ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={24} className="text-[#9898a5] animate-spin-slow" />
              </div>
            ) : (
              <>
                {activeSection === "llm" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#9898a5] block mb-1.5">API Base URL</label>
                      <input
                        type="url"
                        value={(llm.baseUrl as string) ?? ""}
                        onChange={(e) => set(["llm", "baseUrl"], e.target.value)}
                        placeholder="https://api.quatarly.cloud/v1"
                        className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#9898a5] block mb-1.5">API Key</label>
                      <input
                        type="password"
                        value={(llm.apiKey as string) ?? ""}
                        onChange={(e) => set(["llm", "apiKey"], e.target.value)}
                        placeholder="sk-…"
                        className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#9898a5] block mb-1.5">Routing Mode</label>
                      <select
                        value={(llm.routing as string) ?? "auto"}
                        onChange={(e) => set(["llm", "routing"], e.target.value)}
                        className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-colors"
                      >
                        <option value="auto">Auto (smart routing)</option>
                        <option value="fixed">Fixed (always same model)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(["fastModel", "standardModel", "powerfulModel"] as const).map((key) => (
                        <div key={key}>
                          <label className="text-xs font-medium text-[#9898a5] block mb-1.5 capitalize">
                            {key.replace("Model", "")} Model
                          </label>
                          <input
                            type="text"
                            value={(llm[key] as string) ?? ""}
                            onChange={(e) => set(["llm", key], e.target.value)}
                            className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500/50 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === "editor" && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-[#9898a5] block mb-1.5">Font Size</label>
                        <input
                          type="number"
                          min={10}
                          max={24}
                          value={(editor.fontSize as number) ?? 14}
                          onChange={(e) => set(["editor", "fontSize"], parseInt(e.target.value))}
                          className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#9898a5] block mb-1.5">Tab Size</label>
                        <select
                          value={(editor.tabSize as number) ?? 2}
                          onChange={(e) => set(["editor", "tabSize"], parseInt(e.target.value))}
                          className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-colors"
                        >
                          <option value={2}>2 spaces</option>
                          <option value={4}>4 spaces</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#2d2d32]">
                      <span className="text-sm text-white">Word Wrap</span>
                      <button
                        onClick={() => set(["editor", "wordWrap"], !editor.wordWrap)}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative",
                          editor.wordWrap ? "bg-brand-600" : "bg-[#2d2d32]"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                            editor.wordWrap ? "translate-x-5" : "translate-x-0.5"
                          )}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-white">Minimap</span>
                      <button
                        onClick={() => set(["editor", "minimap"], !editor.minimap)}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative",
                          editor.minimap ? "bg-brand-600" : "bg-[#2d2d32]"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                            editor.minimap ? "translate-x-5" : "translate-x-0.5"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === "preview" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between py-2 border-b border-[#2d2d32]">
                      <div>
                        <span className="text-sm text-white">Auto Refresh</span>
                        <p className="text-xs text-[#9898a5]">Refresh preview on file save</p>
                      </div>
                      <button
                        onClick={() => set(["preview", "autoRefresh"], !preview.autoRefresh)}
                        className={cn("w-10 h-5 rounded-full transition-colors relative", preview.autoRefresh ? "bg-brand-600" : "bg-[#2d2d32]")}
                      >
                        <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform", preview.autoRefresh ? "translate-x-5" : "translate-x-0.5")} />
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === "git" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#9898a5] block mb-1.5">Default Branch</label>
                      <input
                        type="text"
                        value={(git.defaultBranch as string) ?? "main"}
                        onChange={(e) => set(["git", "defaultBranch"], e.target.value)}
                        className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#9898a5] block mb-1.5">Commit Message Template</label>
                      <input
                        type="text"
                        value={(git.commitMessage as string) ?? "AI: {description}"}
                        onChange={(e) => set(["git", "commitMessage"], e.target.value)}
                        className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
                      />
                    </div>
                  </div>
                )}

                {activeSection === "mobile" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between py-2 border-b border-[#2d2d32]">
                      <div>
                        <span className="text-sm text-white">Enable Capacitor</span>
                        <p className="text-xs text-[#9898a5]">Build native iOS/Android apps</p>
                      </div>
                      <button
                        onClick={() => set(["mobile", "enableCapacitor"], !mobile.enableCapacitor)}
                        className={cn("w-10 h-5 rounded-full transition-colors relative", mobile.enableCapacitor ? "bg-brand-600" : "bg-[#2d2d32]")}
                      >
                        <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform", mobile.enableCapacitor ? "translate-x-5" : "translate-x-0.5")} />
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === "about" && (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-[#0f0f10] rounded-xl border border-[#2d2d32]">
                      <h3 className="text-sm font-semibold text-white mb-1">Lovable Solo</h3>
                      <p className="text-xs text-[#9898a5]">Version 1.0.0</p>
                      <p className="text-xs text-[#9898a5] mt-2">
                        A self-hosted AI IDE powered by your own LLM API keys.
                      </p>
                    </div>
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      View on GitHub →
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#2d2d32] flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm text-[#9898a5] hover:text-white hover:bg-[#242428] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              saving ? "bg-[#2d2d32] text-[#9898a5]" : "bg-brand-600 hover:bg-brand-500 text-white"
            )}
          >
            {saving ? <Loader2 size={13} className="animate-spin-slow" /> : <Save size={13} />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
