import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Search,
  FolderOpen,
  Github,
  MoreHorizontal,
  Trash2,
  Settings2,
  Clock,
  Code2,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { ProjectInfo } from '@/store/useStore';
import { toast } from 'sonner';

const TEMPLATES = [
  { id: 'react-vite', name: 'React + Vite', icon: '⚛️', color: 'text-blue-400' },
  { id: 'nextjs', name: 'Next.js', icon: '▲', color: 'text-white' },
  { id: 'vue', name: 'Vue 3', icon: '💚', color: 'text-green-400' },
  { id: 'svelte', name: 'SvelteKit', icon: '🧡', color: 'text-orange-400' },
  { id: 'landing', name: 'Landing Page', icon: '🚀', color: 'text-purple-400' },
  { id: 'dashboard', name: 'Dashboard', icon: '📊', color: 'text-yellow-400' },
  { id: 'api', name: 'Express API', icon: '🟢', color: 'text-green-400' },
  { id: 'blank', name: 'Blank', icon: '📄', color: 'text-muted-foreground' },
];

const FRAMEWORK_ICONS: Record<string, string> = {
  react: '⚛️',
  next: '▲',
  vue: '💚',
  svelte: '🧡',
  angular: '🔴',
  vite: '⚡',
  express: '🟢',
  unknown: '📦',
};

interface ProjectSwitcherProps {
  open: boolean;
  onClose: () => void;
  onOpenGitHubImport: () => void;
}

export default function ProjectSwitcher({ open, onClose, onOpenGitHubImport }: ProjectSwitcherProps) {
  const { projects, currentProjectId, setCurrentProjectId, settings, addProject, removeProject } = useStore();
  const [search, setSearch] = useState('');
  const [showNewWizard, setShowNewWizard] = useState(false);
  const [menuProject, setMenuProject] = useState<string | null>(null);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.framework?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelect(project: ProjectInfo) {
    setCurrentProjectId(project.id);
    onClose();
    toast.success(`Switched to ${project.name}`);
  }

  async function handleDelete(project: ProjectInfo) {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`${settings.orchestratorUrl}/projects/${project.id}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore if server not available
    }
    removeProject(project.id);
    toast.success(`${project.name} deleted`);
    setMenuProject(null);
  }

  if (!open) return null;

  if (showNewWizard) {
    return (
      <NewProjectWizard
        onClose={() => setShowNewWizard(false)}
        onCreated={() => { setShowNewWizard(false); onClose(); }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-start"
      onClick={onClose}
    >
      <div
        className="mt-[48px] ml-2 w-[320px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>

        {/* Projects list */}
        <div className="max-h-[340px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <FolderOpen size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? `No results for "${search}"` : 'No projects yet'}
              </p>
            </div>
          ) : (
            filtered.map((project) => (
              <div
                key={project.id}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-accent/20',
                  currentProjectId === project.id && 'bg-primary/10',
                )}
                onClick={() => handleSelect(project)}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm shrink-0">
                  {FRAMEWORK_ICONS[project.framework ?? 'unknown'] ?? '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', currentProjectId === project.id ? 'text-primary' : 'text-foreground')}>
                    {project.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {project.framework && (
                      <span className="capitalize">{project.framework}</span>
                    )}
                    {project.port && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Globe size={9} /> :{project.port}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Clock size={9} /> {formatTime(project.createdAt)}
                    </span>
                  </div>
                </div>
                {currentProjectId === project.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
                {/* Context menu */}
                <div className="hidden group-hover:flex items-center shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuProject(menuProject === project.id ? null : project.id); }}
                    className="p-1 rounded hover:bg-accent/40 text-muted-foreground"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
                {menuProject === project.id && (
                  <div
                    className="absolute right-2 top-full mt-1 bg-card border border-border rounded-lg shadow-xl p-1 z-50 min-w-[140px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/20"
                      onClick={() => { setMenuProject(null); }}
                    >
                      <Settings2 size={12} /> Settings
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(project)}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-2 flex gap-1">
          <button
            onClick={() => { setShowNewWizard(true); }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
          >
            <Plus size={13} /> New Project
          </button>
          <button
            onClick={() => { onOpenGitHubImport(); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent/20 text-muted-foreground text-xs font-medium transition-colors"
          >
            <Github size={13} /> Import
          </button>
        </div>
      </div>
    </div>
  );
}

function NewProjectWizard({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { settings, addProject, setCurrentProjectId } = useStore();
  const [name, setName] = useState('my-project');
  const [selectedTemplate, setSelectedTemplate] = useState('react-vite');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const resp = await fetch(`${settings.orchestratorUrl}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, template: selectedTemplate, description }),
      });
      if (resp.ok) {
        const project = await resp.json();
        addProject(project);
        setCurrentProjectId(project.id);
        toast.success(`${name} created!`);
        onCreated();
        return;
      }
    } catch {
      // create locally
    }
    const project = {
      id: crypto.randomUUID(),
      name,
      path: `workspaces/${name}`,
      template: selectedTemplate,
      framework: selectedTemplate === 'react-vite' || selectedTemplate === 'landing' || selectedTemplate === 'dashboard' ? 'react' : selectedTemplate,
      description,
      createdAt: new Date().toISOString(),
    };
    addProject(project);
    setCurrentProjectId(project.id);
    toast.success(`${name} created!`);
    setCreating(false);
    onCreated();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">New Project</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Project name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="my-awesome-app"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="What does this project do?"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Template</label>
            <div className="grid grid-cols-4 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                    selectedTemplate === t.id
                      ? 'bg-primary/10 border-primary'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span className={cn('text-[10px] font-medium leading-tight text-center', selectedTemplate === t.id ? 'text-primary' : 'text-muted-foreground')}>
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? 'Creating…' : (
                <><Plus size={14} /> Create Project</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
