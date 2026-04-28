import { useState, useEffect, useRef } from "react";
import { Search, ArrowRight } from "lucide-react";
import { useProjectStore, type PanelMode } from "@/stores/projectStore";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setPanelMode, projects, activateProject, getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();

  // Build commands
  const allCommands: Command[] = [
    // Panel modes
    { id: "mode-preview", label: "Switch to Preview", icon: "🌐", category: "Navigate", action: () => setPanelMode("preview") },
    { id: "mode-code", label: "Switch to Code", icon: "📄", category: "Navigate", action: () => setPanelMode("code") },
    { id: "mode-cloud", label: "Switch to Cloud", icon: "☁️", category: "Navigate", action: () => setPanelMode("cloud") },
    { id: "mode-analytics", label: "Switch to Analytics", icon: "📈", category: "Navigate", action: () => setPanelMode("analytics") },

    // Projects
    ...projects.slice(0, 10).map((p) => ({
      id: `project-${p.id}`,
      label: `Switch to "${p.name}"`,
      icon: "📁",
      category: "Projects",
      action: () => activateProject(p.id),
    })),

    // AI actions
    { id: "ai-fix-ts", label: "Fix TypeScript errors", icon: "🔧", category: "AI Actions", action: () => {} },
    { id: "ai-dark-mode", label: "Add dark mode", icon: "🌙", category: "AI Actions", action: () => {} },
    { id: "ai-responsive", label: "Make responsive", icon: "📱", category: "AI Actions", action: () => {} },
    { id: "ai-tests", label: "Add unit tests", icon: "🧪", category: "AI Actions", action: () => {} },
  ];

  const filtered = query
    ? allCommands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : allCommands;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[selectedIndex]?.action();
      setOpen(false);
    }
  };

  if (!open) return null;

  // Group by category
  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slide-up">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, files, projects..."
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none"
          />
          <kbd className="hidden sm:inline text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">No commands found</div>
          ) : (
            Object.entries(grouped).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {category}
                </div>
                {cmds.map((cmd, relIdx) => {
                  const globalIdx = filtered.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors min-h-[44px]",
                        globalIdx === selectedIndex
                          ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                      onClick={() => { cmd.action(); setOpen(false); }}
                    >
                      <span className="text-base">{cmd.icon}</span>
                      <span className="flex-1">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                          {cmd.shortcut}
                        </kbd>
                      )}
                      {globalIdx === selectedIndex && (
                        <ArrowRight size={14} className="text-purple-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">↵</kbd> select</span>
          <span><kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
