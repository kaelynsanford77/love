import { useState } from 'react';
import {
  Globe,
  FileText,
  Code2,
  Cloud,
  BarChart3,
  History,
  Columns2,
  MoreHorizontal,
  Monitor,
  Tablet,
  Smartphone,
  Maximize,
  ArrowUpRight,
  RotateCw,
  MessageCircle,
  Share2,
  GitBranch,
  Zap,
  ChevronDown,
  Search,
  Database,
  Github,
  Settings,
  Terminal,
  QrCode,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Mode, Viewport } from '@/App';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface ToolbarProps {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  viewport: Viewport;
  onViewportChange: (v: Viewport) => void;
  route: string;
  onRouteChange: (r: string) => void;
  onTerminalToggle: () => void;
  onOpenCommandPalette: () => void;
  onOpenGitHubImport: () => void;
  onOpenSupabase: () => void;
  onOpenProjectSwitcher: () => void;
  onOpenQRPairing: () => void;
}

const MODES: { id: Mode; icon: React.ReactNode; label: string }[] = [
  { id: 'preview', icon: <Globe size={15} />, label: 'Preview' },
  { id: 'files', icon: <FileText size={15} />, label: 'Files' },
  { id: 'code', icon: <Code2 size={15} />, label: 'Code' },
  { id: 'cloud', icon: <Cloud size={15} />, label: 'Cloud' },
  { id: 'analytics', icon: <BarChart3 size={15} />, label: 'Analytics' },
];

const VIEWPORTS: { id: Viewport; icon: React.ReactNode; label: string }[] = [
  { id: 'desktop', icon: <Monitor size={14} />, label: 'Desktop' },
  { id: 'tablet', icon: <Tablet size={14} />, label: 'Tablet 768' },
  { id: 'mobile', icon: <Smartphone size={14} />, label: 'Mobile 375' },
  { id: 'fullscreen', icon: <Maximize size={14} />, label: 'Fullscreen' },
];

export default function Toolbar({
  mode,
  onModeChange,
  viewport,
  onViewportChange,
  route,
  onRouteChange,
  onTerminalToggle,
  onOpenCommandPalette,
  onOpenGitHubImport,
  onOpenSupabase,
  onOpenProjectSwitcher,
  onOpenQRPairing,
}: ToolbarProps) {
  const [vpOpen, setVpOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { projects, currentProjectId } = useStore();

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const projectName = currentProject?.name ?? 'Lovable Solo';

  return (
    <div
      className="flex items-center h-[48px] w-full border-b border-border bg-card px-2 gap-1 select-none shrink-0 z-50"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      {/* Left group */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenProjectSwitcher}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-accent/20 font-semibold text-sm text-foreground transition-colors max-w-[160px]"
        >
          <span className="truncate">{projectName}</span>
          <ChevronDown size={13} className="text-muted-foreground shrink-0" />
        </button>
        <ToolbarIconBtn icon={<History size={15} />} tooltip="History" />
        <ToolbarIconBtn icon={<Columns2 size={15} />} tooltip="Split view" />
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

      {/* Mode switcher */}
      <div className="hidden sm:flex items-center relative">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-all duration-150',
              mode === m.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/20',
            )}
          >
            {m.icon}
            <span className="hidden md:inline">{m.label}</span>
          </button>
        ))}
        {/* More menu */}
        <div className="relative">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="relative flex items-center justify-center w-7 h-7 rounded hover:bg-accent/20 text-muted-foreground hover:text-foreground transition-colors"
            title="More"
          >
            <MoreHorizontal size={15} />
          </button>
          {moreOpen && (
            <div
              className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-xl p-1 z-50 min-w-[200px]"
              onClick={() => setMoreOpen(false)}
            >
              <MoreMenuItem icon={<Terminal size={13} />} label="Toggle Terminal" onClick={onTerminalToggle} />
              <MoreMenuItem icon={<Github size={13} />} label="Import GitHub Repo" onClick={onOpenGitHubImport} />
              <MoreMenuItem icon={<Database size={13} />} label="Connect Database" onClick={onOpenSupabase} />
              <MoreMenuItem icon={<QrCode size={13} />} label="Mobile Access (QR)" onClick={onOpenQRPairing} />
              <div className="h-px bg-border my-1" />
              <MoreMenuItem icon={<Search size={13} />} label="Command Palette ⌘K" onClick={onOpenCommandPalette} />
              <MoreMenuItem icon={<Settings size={13} />} label="Settings" onClick={() => useStore.getState().setSettingsOpen(true)} />
            </div>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

      {/* URL controls */}
      <div className="hidden sm:flex items-center gap-1">
        {/* Viewport picker */}
        <div className="relative">
          <button
            onClick={() => setVpOpen((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent/20 text-muted-foreground transition-colors"
          >
            {VIEWPORTS.find((v) => v.id === viewport)?.icon}
            <ChevronDown size={11} />
          </button>
          {vpOpen && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-xl p-1 z-50 min-w-[160px]">
              {VIEWPORTS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { onViewportChange(v.id); setVpOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent/20 transition-colors',
                    viewport === v.id && 'text-primary',
                  )}
                >
                  {v.icon}
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Route input */}
        <input
          value={route}
          onChange={(e) => onRouteChange(e.target.value)}
          className="w-32 px-2 py-1 rounded bg-muted/60 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          placeholder="/"
        />
        <ToolbarIconBtn icon={<ArrowUpRight size={14} />} tooltip="Open in new tab" onClick={() => window.open(route, '_blank')} />
        <ToolbarIconBtn icon={<RotateCw size={14} />} tooltip="Reload" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Command palette button (mobile) */}
      <button
        onClick={onOpenCommandPalette}
        className="sm:hidden flex items-center justify-center w-7 h-7 rounded hover:bg-accent/20 text-muted-foreground transition-colors"
        title="Command Palette"
      >
        <Search size={15} />
      </button>

      {/* Right group */}
      <div className="flex items-center gap-1">
        {/* ⌘K hint */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-accent/20 text-muted-foreground hover:text-foreground transition-colors text-xs"
          title="Command Palette (⌘K)"
        >
          <Search size={13} />
          <kbd className="bg-muted px-1 rounded text-[10px]">⌘K</kbd>
        </button>
        <ToolbarIconBtn icon={<MessageCircle size={15} />} tooltip="Comments" badge={0} />
        <ToolbarIconBtn icon={<GitBranch size={15} />} tooltip="Git" />
        <button
          className="px-3 py-1 rounded-md text-sm font-medium hover:bg-accent/20 text-muted-foreground transition-colors hidden sm:flex items-center gap-1.5"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied!');
          }}
        >
          <Share2 size={14} />
          Share
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all">
          <Zap size={14} />
          <span className="hidden sm:inline">Publish</span>
        </button>
      </div>
    </div>
  );
}

function MoreMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors text-left"
    >
      {icon}
      {label}
    </button>
  );
}

function ToolbarIconBtn({
  icon,
  tooltip,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  tooltip: string;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      title={tooltip}
      onClick={onClick}
      className="relative flex items-center justify-center w-7 h-7 rounded hover:bg-accent/20 text-muted-foreground hover:text-foreground transition-colors"
    >
      {icon}
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}
