import React from "react";
import {
  MessageSquare,
  Eye,
  Code2,
  Cloud,
  Settings,
  Terminal,
  ChevronDown,
  Zap,
  Command,
  Play,
  Square,
  Github,
  Share2,
} from "lucide-react";
import type { ActiveMode, Project } from "../types";
import { cn } from "../utils";

interface TopBarProps {
  activeMode: ActiveMode;
  onModeChange: (mode: ActiveMode) => void;
  onProjectSwitch: () => void;
  onSettings: () => void;
  onCommand: () => void;
  activeProject: Project | null;
  isMobile: boolean;
}

const MODES: { id: ActiveMode; label: string; icon: React.ReactNode }[] = [
  { id: "chat", label: "Chat", icon: <MessageSquare size={14} /> },
  { id: "preview", label: "Preview", icon: <Eye size={14} /> },
  { id: "code", label: "Code", icon: <Code2 size={14} /> },
  { id: "cloud", label: "Cloud", icon: <Cloud size={14} /> },
];

export function TopBar({
  activeMode,
  onModeChange,
  onProjectSwitch,
  onSettings,
  onCommand,
  activeProject,
  isMobile,
}: TopBarProps) {
  return (
    <header className="h-12 flex items-center px-3 gap-2 border-b border-[#2d2d32] bg-[#0f0f10] flex-shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-1.5 mr-1">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <Zap size={13} className="text-white" />
        </div>
        {!isMobile && (
          <span className="text-sm font-semibold text-white tracking-tight">Lovable</span>
        )}
      </div>

      {/* Project Switcher */}
      <button
        onClick={onProjectSwitch}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium",
          "text-[#9898a5] hover:text-[#e8e8ed] hover:bg-[#1a1a1d] transition-colors",
          "border border-transparent hover:border-[#2d2d32]",
          isMobile ? "max-w-[120px]" : "max-w-[180px]"
        )}
      >
        <span className="truncate">
          {activeProject ? activeProject.name : "No project"}
        </span>
        <ChevronDown size={12} className="flex-shrink-0 opacity-60" />
      </button>

      {/* Mode Switcher */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-0.5 bg-[#1a1a1d] rounded-lg p-0.5 border border-[#2d2d32]">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeMode === mode.id
                  ? "bg-[#242428] text-white shadow-sm"
                  : "text-[#9898a5] hover:text-[#e8e8ed]",
                isMobile && "px-2"
              )}
            >
              {mode.icon}
              {!isMobile && <span>{mode.label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {!isMobile && (
          <>
            <button
              onClick={onCommand}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[#9898a5] hover:text-[#e8e8ed] hover:bg-[#1a1a1d] transition-colors"
              title="Command Palette (Ctrl+K)"
            >
              <Command size={13} />
              <span className="text-[10px] opacity-60">⌘K</span>
            </button>
            <button className="p-1.5 rounded-md text-[#9898a5] hover:text-[#e8e8ed] hover:bg-[#1a1a1d] transition-colors">
              <Github size={15} />
            </button>
            <button className="p-1.5 rounded-md text-[#9898a5] hover:text-[#e8e8ed] hover:bg-[#1a1a1d] transition-colors">
              <Share2 size={15} />
            </button>
          </>
        )}
        <button
          onClick={onSettings}
          className="p-1.5 rounded-md text-[#9898a5] hover:text-[#e8e8ed] hover:bg-[#1a1a1d] transition-colors"
          title="Settings"
        >
          <Settings size={15} />
        </button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center ml-1">
          <span className="text-xs font-bold text-white">U</span>
        </div>
      </div>
    </header>
  );
}
