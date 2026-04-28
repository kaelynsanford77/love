import React, { useState, useEffect, useRef } from "react";
import { Search, X, MessageSquare, Eye, Code2, Cloud, Settings, Zap, ArrowRight } from "lucide-react";
import type { ActiveMode } from "../types";
import { cn } from "../utils";

interface CommandPaletteProps {
  onClose: () => void;
  onModeChange: (mode: ActiveMode) => void;
  onProjectSwitch: () => void;
  onSettings: () => void;
}

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette({ onClose, onModeChange, onProjectSwitch, onSettings }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { id: "chat", label: "Switch to Chat", description: "Open AI chat panel", icon: <MessageSquare size={15} />, category: "Modes", action: () => { onModeChange("chat"); onClose(); }, shortcut: "C" },
    { id: "preview", label: "Switch to Preview", description: "Open preview panel", icon: <Eye size={15} />, category: "Modes", action: () => { onModeChange("preview"); onClose(); }, shortcut: "P" },
    { id: "code", label: "Switch to Code", description: "Open code editor", icon: <Code2 size={15} />, category: "Modes", action: () => { onModeChange("code"); onClose(); }, shortcut: "E" },
    { id: "cloud", label: "Switch to Cloud", description: "Manage Supabase & services", icon: <Cloud size={15} />, category: "Modes", action: () => { onModeChange("cloud"); onClose(); }, shortcut: "D" },
    { id: "projects", label: "Switch Project", description: "Open project switcher", icon: <Zap size={15} />, category: "Projects", action: () => { onProjectSwitch(); onClose(); }, shortcut: "⌘P" },
    { id: "settings", label: "Open Settings", description: "Configure LLM, editor, and more", icon: <Settings size={15} />, category: "Settings", action: () => { onSettings(); onClose(); }, shortcut: "⌘," },
  ];

  const filtered = commands.filter(
    (c) =>
      query === "" ||
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.description?.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  useEffect(() => {
    inputRef.current?.focus();
    setSelected(0);
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); filtered[selected]?.action(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, selected, onClose]);

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-[#1a1a1d] rounded-2xl border border-[#2d2d32] shadow-2xl overflow-hidden animate-fade-in">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2d32]">
          <Search size={16} className="text-[#9898a5] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm text-white placeholder-[#9898a5] outline-none"
          />
          <button onClick={onClose} className="text-[#9898a5] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#9898a5]">No commands found</div>
          ) : (
            Object.entries(grouped).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-[10px] font-semibold text-[#9898a5] uppercase tracking-wider">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const idx = globalIdx++;
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelected(idx)}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors",
                        selected === idx ? "bg-[#242428]" : "hover:bg-[#1e1e21]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex-shrink-0 transition-colors",
                          selected === idx ? "text-brand-400" : "text-[#9898a5]"
                        )}
                      >
                        {cmd.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white">{cmd.label}</span>
                        {cmd.description && (
                          <span className="text-xs text-[#9898a5] ml-2">{cmd.description}</span>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <span className="text-xs text-[#9898a5] bg-[#2d2d32] px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                          {cmd.shortcut}
                        </span>
                      )}
                      {selected === idx && <ArrowRight size={12} className="text-brand-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-[#2d2d32] flex items-center gap-3 text-[10px] text-[#9898a5]">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
