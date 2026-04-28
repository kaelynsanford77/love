import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Settings,
  FolderOpen,
  Github,
  Database,
  Plus,
  Globe,
  Code2,
  Cloud,
  BarChart3,
  FileText,
  Zap,
  Terminal,
  Share2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Mode } from '@/App';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  onModeChange: (m: Mode) => void;
  onOpenGitHubImport: () => void;
  onOpenSupabase: () => void;
  onOpenProjectWizard: () => void;
  onTerminalToggle: () => void;
}

export default function CommandPalette({
  onModeChange,
  onOpenGitHubImport,
  onOpenSupabase,
  onOpenProjectWizard,
  onTerminalToggle,
}: CommandPaletteProps) {
  const { commandPaletteOpen, setCommandPaletteOpen, setSettingsOpen } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    // Navigation
    { id: 'preview', label: 'Go to Preview', icon: <Globe size={15} />, category: 'Navigation', action: () => { onModeChange('preview'); close(); }, keywords: ['view', 'browser'] },
    { id: 'files', label: 'Go to Files', icon: <FileText size={15} />, category: 'Navigation', action: () => { onModeChange('files'); close(); } },
    { id: 'code', label: 'Go to Code', icon: <Code2 size={15} />, category: 'Navigation', action: () => { onModeChange('code'); close(); }, keywords: ['editor', 'monaco'] },
    { id: 'cloud', label: 'Go to Cloud / Database', icon: <Cloud size={15} />, category: 'Navigation', action: () => { onModeChange('cloud'); close(); }, keywords: ['db', 'sql', 'supabase'] },
    { id: 'analytics', label: 'Go to Analytics', icon: <BarChart3 size={15} />, category: 'Navigation', action: () => { onModeChange('analytics'); close(); }, keywords: ['charts', 'stats'] },
    // Actions
    { id: 'new-project', label: 'New Project', icon: <Plus size={15} />, category: 'Projects', action: () => { onOpenProjectWizard(); close(); }, keywords: ['create', 'project'] },
    { id: 'import-github', label: 'Import GitHub Repository', icon: <Github size={15} />, category: 'Projects', action: () => { onOpenGitHubImport(); close(); }, keywords: ['clone', 'repo', 'git'] },
    { id: 'connect-supabase', label: 'Connect Supabase / Database', icon: <Database size={15} />, category: 'Projects', action: () => { onOpenSupabase(); close(); }, keywords: ['postgres', 'db', 'connect'] },
    { id: 'terminal', label: 'Toggle Terminal', icon: <Terminal size={15} />, category: 'Tools', action: () => { onTerminalToggle(); close(); }, keywords: ['console', 'shell', 'bash'] },
    { id: 'publish', label: 'Publish Project', icon: <Zap size={15} />, category: 'Tools', action: () => { close(); }, keywords: ['deploy', 'build'] },
    { id: 'share', label: 'Share Project', icon: <Share2 size={15} />, category: 'Tools', action: () => { close(); }, keywords: ['url', 'link'] },
    { id: 'open-project', label: 'Open Project Folder', icon: <FolderOpen size={15} />, category: 'Projects', action: () => { close(); }, keywords: ['workspace', 'folder'] },
    { id: 'settings', label: 'Open Settings', icon: <Settings size={15} />, category: 'App', action: () => { setSettingsOpen(true); close(); }, keywords: ['preferences', 'config'] },
  ];

  const filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase()) ||
          c.keywords?.some((k) => k.includes(query.toLowerCase())),
      )
    : commands;

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  function close() {
    setCommandPaletteOpen(false);
    setQuery('');
  }

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [commandPaletteOpen]);

  const [selected, setSelected] = useState(0);
  const flatFiltered = filtered;

  useEffect(() => {
    setSelected(0);
  }, [query]);

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-[600px] mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close();
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, flatFiltered.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              }
              if (e.key === 'Enter') {
                const cmd = flatFiltered[selected];
                if (cmd) cmd.action();
              }
            }}
            placeholder="Search commands…"
            className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          <button onClick={close} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No results for "{query}"</p>
          ) : (
            Object.entries(grouped).map(([category, cmds]) => (
              <div key={category}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </p>
                {cmds.map((cmd) => {
                  const idx = flatFiltered.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelected(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left',
                        idx === selected
                          ? 'bg-primary/15 text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span className="text-muted-foreground">{cmd.icon}</span>
                      <span className="flex-1">{cmd.label}</span>
                      {cmd.description && (
                        <span className="text-xs text-muted-foreground">{cmd.description}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span><kbd className="bg-muted px-1 rounded">↑↓</kbd> Navigate</span>
          <span><kbd className="bg-muted px-1 rounded">↵</kbd> Select</span>
          <span><kbd className="bg-muted px-1 rounded">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
