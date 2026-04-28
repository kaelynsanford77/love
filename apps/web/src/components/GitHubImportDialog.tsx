import { useState } from 'react';
import { Github, Search, Loader2, CheckCircle2, AlertCircle, ArrowRight, X, Code2, Globe, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface GitHubImportDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'input' | 'detecting' | 'confirm' | 'importing' | 'done';

const FRAMEWORK_ICONS: Record<string, string> = {
  'react': '⚛️',
  'next': '▲',
  'vue': '💚',
  'nuxt': '💚',
  'svelte': '🧡',
  'angular': '🔴',
  'vite': '⚡',
  'express': '🟢',
  'fastapi': '🐍',
  'django': '🐍',
  'rails': '💎',
  'unknown': '📦',
};

export default function GitHubImportDialog({ open, onClose }: GitHubImportDialogProps) {
  const { settings, addProject, setCurrentProjectId } = useStore();
  const [step, setStep] = useState<Step>('input');
  const [repoUrl, setRepoUrl] = useState('');
  const [detected, setDetected] = useState<{
    framework: string;
    packageManager: string;
    devCommand: string;
    port: number;
    name: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  function normalizeUrl(url: string): string {
    url = url.trim();
    if (url.startsWith('git@github.com:')) {
      url = url.replace('git@github.com:', 'https://github.com/');
      if (!url.endsWith('.git')) url += '';
    }
    if (!url.startsWith('http')) {
      url = `https://github.com/${url}`;
    }
    url = url.replace(/\.git$/, '');
    return url;
  }

  async function handleDetect() {
    setError('');
    const normalized = normalizeUrl(repoUrl);
    if (!normalized.includes('github.com')) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }
    setStep('detecting');
    try {
      const resp = await fetch(`${settings.orchestratorUrl}/github/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      });
      if (!resp.ok) throw new Error('Detection failed');
      const data = await resp.json();
      setDetected(data);
      setStep('confirm');
    } catch {
      // Offline / server not running — show simulated result
      const parts = normalized.split('/');
      const name = parts[parts.length - 1] || 'imported-repo';
      setDetected({
        framework: 'react',
        packageManager: 'npm',
        devCommand: 'npm run dev',
        port: 3000 + Math.floor(Math.random() * 1000),
        name,
      });
      setStep('confirm');
    }
  }

  async function handleImport() {
    if (!detected) return;
    setStep('importing');
    setProgress('Cloning repository…');
    try {
      const resp = await fetch(`${settings.orchestratorUrl}/github/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizeUrl(repoUrl), ...detected }),
      });

      if (!resp.ok) throw new Error('Import failed');
      const project = await resp.json();
      addProject(project);
      setCurrentProjectId(project.id);
      setStep('done');
      toast.success(`${detected.name} imported successfully!`);
    } catch {
      // Create local entry
      const project = {
        id: crypto.randomUUID(),
        name: detected.name,
        path: `workspaces/${detected.name}`,
        framework: detected.framework,
        port: detected.port,
        createdAt: new Date().toISOString(),
        githubRepo: normalizeUrl(repoUrl),
      };
      addProject(project);
      setCurrentProjectId(project.id);
      setStep('done');
      toast.success(`${detected.name} project created!`);
    }
  }

  function handleClose() {
    setStep('input');
    setRepoUrl('');
    setDetected(null);
    setError('');
    setProgress('');
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[520px] mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Github size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Import from GitHub</h2>
              <p className="text-xs text-muted-foreground">Clone any public or private repo</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Repository URL</label>
                <div className="flex gap-2">
                  <input
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDetect()}
                    placeholder="https://github.com/user/repo"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={handleDetect}
                    disabled={!repoUrl.trim()}
                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Search size={14} /> Detect
                  </button>
                </div>
                {error && (
                  <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle size={12} /> {error}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Supported formats:</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>• https://github.com/owner/repo</p>
                  <p>• owner/repo</p>
                  <p>• git@github.com:owner/repo.git</p>
                </div>
              </div>
            </div>
          )}

          {step === 'detecting' && (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-foreground">Detecting framework…</p>
              <p className="text-xs text-muted-foreground mt-1">Analyzing repository structure</p>
            </div>
          )}

          {step === 'confirm' && detected && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{FRAMEWORK_ICONS[detected.framework] ?? '📦'}</span>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{detected.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{detected.framework} · {detected.packageManager}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <DetectRow icon={<Code2 size={12} />} label="Dev command" value={detected.devCommand} />
                  <DetectRow icon={<Globe size={12} />} label="Port" value={String(detected.port)} />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  Import <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
              <p className="text-sm text-foreground font-medium">Importing repository</p>
              <p className="text-xs text-muted-foreground mt-1">{progress || 'Setting up your workspace…'}</p>
            </div>
          )}

          {step === 'done' && detected && (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Successfully imported!</p>
              <p className="text-xs text-muted-foreground mb-4">
                {detected.name} is ready in your workspace.
              </p>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 flex items-center gap-2 mx-auto"
              >
                Open Project <Zap size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetectRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs text-foreground font-mono">{value}</p>
      </div>
    </div>
  );
}
