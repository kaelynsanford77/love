import { useState } from "react";
import {
  Globe, Code2, Cloud, BarChart2, Menu, Plus, ChevronDown,
  Settings, Upload, GitBranch, Zap
} from "lucide-react";
import { useProjectStore, type PanelMode } from "@/stores/projectStore";
import { ProjectSwitcher } from "@/components/modals/ProjectSwitcher";
import { SettingsPanel } from "@/components/modals/SettingsPanel";
import { cn, FRAMEWORK_ICONS } from "@/lib/utils";

interface ToolbarProps {
  isMobile: boolean;
  onChatToggle: () => void;
}

const MODES: { id: PanelMode; icon: React.ReactNode; label: string }[] = [
  { id: "preview", icon: <Globe size={16} />, label: "Preview" },
  { id: "code", icon: <Code2 size={16} />, label: "Code" },
  { id: "cloud", icon: <Cloud size={16} />, label: "Cloud" },
  { id: "analytics", icon: <BarChart2 size={16} />, label: "Analytics" },
];

export function Toolbar({ isMobile, onChatToggle }: ToolbarProps) {
  const { panelMode, setPanelMode, getActiveProject } = useProjectStore();
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const project = getActiveProject();

  return (
    <>
      <header className="flex items-center h-12 px-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 gap-2">
        {/* Logo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            ✦
          </div>
          {!isMobile && (
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Lovable
            </span>
          )}
        </div>

        {/* Project switcher */}
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors max-w-48 min-h-[44px]"
          onClick={() => setProjectSwitcherOpen(true)}
        >
          {project ? (
            <>
              <span className="text-base">{FRAMEWORK_ICONS[project.framework] || "📦"}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {project.name}
              </span>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                project.status === "running" ? "bg-green-500" :
                project.status === "starting" ? "bg-yellow-500 animate-pulse" :
                "bg-gray-400"
              )} />
            </>
          ) : (
            <span className="text-sm text-gray-500">Select project</span>
          )}
          <ChevronDown size={14} className="text-gray-400 shrink-0" />
        </button>

        {/* Mode switcher (desktop) */}
        {!isMobile && (
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
            {MODES.map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setPanelMode(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  panelMode === id
                    ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Mobile: mode icons only */}
        {isMobile && (
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
            {MODES.map(({ id, icon }) => (
              <button
                key={id}
                onClick={() => setPanelMode(id)}
                className={cn(
                  "p-1.5 rounded-md transition-all min-h-[36px] min-w-[36px] flex items-center justify-center",
                  panelMode === id
                    ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                {icon}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Right actions */}
        {!isMobile && (
          <div className="flex items-center gap-1">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={14} />
              Settings
            </button>
          </div>
        )}

        {/* Mobile overflow */}
        {isMobile && (
          <div className="relative">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setOverflowOpen(!overflowOpen)}
            >
              <Menu size={18} />
            </button>
            {overflowOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-in">
                <button
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-left min-h-[44px]"
                  onClick={() => { setSettingsOpen(true); setOverflowOpen(false); }}
                >
                  <Settings size={16} /> Settings
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Modals */}
      <ProjectSwitcher
        open={projectSwitcherOpen}
        onClose={() => setProjectSwitcherOpen(false)}
      />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
