import { useState, useEffect } from "react";
import { Plus, Github, Search, Trash2, Copy, ChevronRight, FolderOpen, MoreVertical } from "lucide-react";
import { useProjectStore, type Project } from "@/stores/projectStore";
import { ImportGitHubModal } from "./ImportGitHubModal";
import { NewProjectWizard } from "./NewProjectWizard";
import { cn, FRAMEWORK_ICONS, FRAMEWORK_LABELS, formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";

interface ProjectSwitcherProps {
  open: boolean;
  onClose: () => void;
}

export function ProjectSwitcher({ open, onClose }: ProjectSwitcherProps) {
  const { projects, activeProjectId, activateProject, deleteProject, renameProject, duplicateProject, fetchProjects } = useProjectStore();
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ projectId: string; x: number; y: number } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (open) fetchProjects();
  }, [open, fetchProjects]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleActivate = async (project: Project) => {
    await activateProject(project.id);
    onClose();
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    await renameProject(id, renameValue.trim());
    setRenamingId(null);
    setRenameValue("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    await deleteProject(id);
    toast.success("Project deleted");
  };

  const handleDuplicate = async (id: string) => {
    await duplicateProject(id);
    toast.success("Project duplicated");
    fetchProjects();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 flex items-start justify-center pt-16 px-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Projects</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
              >
                <Github size={14} />
                Import
              </button>
              <button
                onClick={() => setShowNewProject(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Plus size={14} />
                New
              </button>
            </div>
          </div>

          {/* Search */}
          {projects.length > 5 && (
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects..."
                  className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Project list */}
          <div className="max-h-80 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No projects found</div>
            ) : (
              filtered.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group relative",
                    activeProjectId === project.id && "bg-purple-50 dark:bg-purple-900/20"
                  )}
                  onClick={() => handleActivate(project)}
                >
                  <span className="text-xl shrink-0">{FRAMEWORK_ICONS[project.framework] || "📦"}</span>
                  <div className="flex-1 min-w-0">
                    {renamingId === project.id ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(project.id);
                          if (e.key === "Escape") { setRenamingId(null); e.stopPropagation(); }
                        }}
                        onBlur={() => handleRename(project.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white dark:bg-gray-700 border border-purple-500 rounded px-2 py-0.5 text-sm focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {project.name}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {FRAMEWORK_LABELS[project.framework] || "Unknown"}
                      </span>
                      <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(project.updated_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      project.status === "running" ? "bg-green-500" :
                      project.status === "starting" ? "bg-yellow-500 animate-pulse" :
                      "bg-gray-300"
                    )} />
                    {activeProjectId === project.id && (
                      <ChevronRight size={14} className="text-purple-600" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({ projectId: project.id, x: e.clientX, y: e.clientY });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {filtered.length === 0 && search === "" && (
            <div className="px-4 py-6 text-center">
              <FolderOpen size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">No projects yet</p>
              <button
                onClick={() => setShowNewProject(true)}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition-colors font-medium"
              >
                Create your first project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 w-44"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-left min-h-[36px]"
            onClick={() => {
              const p = projects.find((p) => p.id === contextMenu.projectId);
              if (p) { setRenamingId(p.id); setRenameValue(p.name); }
              setContextMenu(null);
            }}
          >
            ✏️ Rename
          </button>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-left min-h-[36px]"
            onClick={() => { handleDuplicate(contextMenu.projectId); setContextMenu(null); }}
          >
            <Copy size={14} /> Duplicate
          </button>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-left min-h-[36px]"
            onClick={() => { handleDelete(contextMenu.projectId); setContextMenu(null); }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* Sub-modals */}
      <ImportGitHubModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => { setShowImport(false); fetchProjects(); onClose(); }}
      />
      <NewProjectWizard
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
        onCreated={() => { setShowNewProject(false); fetchProjects(); onClose(); }}
      />
    </>
  );
}
