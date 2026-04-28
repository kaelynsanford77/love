import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Github, Loader2, GitBranch } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';

interface DetectResult {
  framework: string;
  packageManager: string;
  devCommand: string;
  port: number;
  name: string;
}

interface GitHubImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function GitHubImportDialog({ open, onClose }: GitHubImportDialogProps) {
  const [url, setUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [nameOverride, setNameOverride] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [detected, setDetected] = useState<DetectResult | null>(null);
  const { setProjectId } = useStore();

  const detect = async () => {
    if (!url.trim()) return;
    setDetecting(true);
    try {
      const result = await api.post<DetectResult>('/github/detect', { url: url.trim() });
      setDetected(result);
      if (!nameOverride) setNameOverride(result.name);
    } catch {
      toast.error('Could not detect framework');
    } finally {
      setDetecting(false);
    }
  };

  const importRepo = async () => {
    if (!url.trim()) return;
    setImporting(true);
    try {
      const result = await api.post<{ id: string; name: string }>('/github/import', {
        url: url.trim(),
        branch,
        name: nameOverride || detected?.name || '',
      });
      setProjectId(result.id);
      toast.success(`Imported ${result.name}`);
      onClose();
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            Import from GitHub
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Repository URL or owner/repo</label>
            <div className="flex gap-2">
              <Input
                placeholder="https://github.com/owner/repo or owner/repo"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setDetected(null); }}
                onBlur={detect}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={detect} disabled={detecting || !url.trim()}>
                {detecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Detect'}
              </Button>
            </div>
          </div>

          {detected && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Framework:</span>
                <Badge variant="secondary" className="text-xs">{detected.framework}</Badge>
                <Badge variant="outline" className="text-xs">{detected.packageManager}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">Dev: <code className="font-mono">{detected.devCommand}</code> on port {detected.port}</div>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Branch</label>
              <div className="flex items-center gap-2">
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Project name</label>
              <Input
                placeholder={detected?.name ?? 'my-project'}
                value={nameOverride}
                onChange={(e) => setNameOverride(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={importRepo} disabled={importing || !url.trim()}>
              {importing && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
