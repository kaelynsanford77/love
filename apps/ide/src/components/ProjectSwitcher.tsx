import React, { useState, useEffect, useRef } from "react";
import { Search, X, Plus, Github, Trash2, Clock, Zap } from "lucide-react";
import type { Project, Toast } from "../types";
import { deleteProject, createProject, importProject } from "../api";
import { cn, formatRelativeTime, getFrameworkIcon } from "../utils";
import { NewProjectWizard } from "./NewProjectWizard";
import { GitHubImportModal } from "./GitHubImportModal";

interface ProjectSwitcherProps {
  projects: Project[];
  activeProject: Project | null;
  onSelect: (project: Project) => void;
  onClose: () => void;
  onToast: (toast: Omit<Toast, "id">) => void;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<Project["status"], string> = {
  idle: "bg-[#9898a5]",
  running: "bg-emerald-400",
  stopped: "bg-yellow-400",
  error: "bg-red-400",
};

export function ProjectSwitcher({
  projects,
  activeProject,
  onSelect,
  onClose,
  onToast,
  onRefresh,
}: ProjectSwitcherProps) {
  const [query, setQuery] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ project: Project; x: number; y: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(project.id);
      onRefresh();
      onToast({ type: "success", title: `Deleted ${project.name}` });
    } catch {
      onToast({ type: "error", title: "Failed to delete project" });
    }
    setContextMenu(null);
  };

  if (showWizard) {
    return (
      <NewProjectWizard
        onClose={() => setShowWizard(false)}
        onCreated={(p) => { onRefresh(); onSelect(p); onClose(); }}
        onToast={onToast}
      />
    );
  }

  if (showImport) {
    return (
      <GitHubImportModal
        onClose={() => setShowImport(false)}
        onImported={(p) => { onRefresh(); onSelect(p); onClose(); }}
        onToast={onToast}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); setContextMenu(null); }}
    >
      <div className="w-full max-w-lg bg-[#1a1a1d] rounded-2xl border border-[#2d2d32] shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2d32]">
          <Search size={16} className="text-[#9898a5]" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="flex-1 bg-transparent text-sm text-white placeholder-[#9898a5] outline-none"
          />
          <button onClick={onClose} className="text-[#9898a5] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Project List */}
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#9898a5]">
              {query ? "No matching projects" : "No projects yet"}
            </div>
          ) : (
            filtered.map((project) => (
              <div
                key={project.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#242428] transition-colors group",
                  activeProject?.id === project.id && "bg-[#242428]"
                )}
                onClick={() => onSelect(project)}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ project, x: e.clientX, y: e.clientY }); }}
              >
                <span className="text-lg w-8 text-center flex-shrink-0">
                  {getFrameworkIcon(project.framework)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{project.name}</span>
                    <span
                      className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_COLORS[project.status])}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#9898a5] capitalize">{project.framework}</span>
                    <span className="text-[#2d2d32]">·</span>
                    <span className="text-xs text-[#9898a5] flex items-center gap-1">
                      <Clock size={10} />
                      {formatRelativeTime(project.lastModified)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(project); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-[#9898a5] hover:text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#2d2d32]">
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white transition-colors"
          >
            <Plus size={13} />
            New Project
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#2d2d32] text-[#9898a5] hover:text-white hover:bg-[#242428] transition-colors"
          >
            <Github size={13} />
            Import from GitHub
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-60 bg-[#1a1a1d] border border-[#2d2d32] rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => handleDelete(contextMenu.project)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
