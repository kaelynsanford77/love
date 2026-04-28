import React, { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image, Upload, Copy, Loader2, FolderOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';

interface Asset {
  name: string;
  path: string;
  url: string;
  size: number;
  type: string;
}

interface AssetManagerProps {
  open: boolean;
  onClose: () => void;
}

export function AssetManager({ open, onClose }: AssetManagerProps) {
  const { projectId } = useStore();
  const [uploading, setUploading] = useState(false);

  const { data: assets = [], refetch } = useQuery({
    queryKey: ['assets', projectId],
    queryFn: () => api.get<{ assets: Asset[] }>(`/fs/assets?projectId=${projectId}`).then((r) => r.assets ?? []),
    enabled: open,
  });

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;
      setUploading(true);
      try {
        for (const file of files) {
          const form = new FormData();
          form.append('file', file);
          form.append('projectId', projectId);
          await fetch(`${import.meta.env.VITE_ORCHESTRATOR_URL ?? 'http://localhost:4000'}/fs/upload`, {
            method: 'POST',
            body: form,
          });
        }
        toast.success(`Uploaded ${files.length} file(s)`);
        refetch();
      } catch {
        toast.error('Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [projectId, refetch]
  );

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path).then(() => toast.success('Path copied!'));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Asset Manager
          </DialogTitle>
        </DialogHeader>
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-lg p-4 text-center mb-3 transition-colors hover:border-primary/50"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Uploading…</span>
            </div>
          ) : (
            <div className="py-2 text-muted-foreground">
              <Upload className="h-6 w-6 mx-auto mb-1 opacity-50" />
              <p className="text-sm">Drag & drop files here to upload</p>
            </div>
          )}
        </div>
        <ScrollArea className="h-72">
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Image className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No assets yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {assets.map((asset) => (
                <div
                  key={asset.path}
                  className="group relative rounded-lg border border-border overflow-hidden bg-muted/30 aspect-square cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => copyPath(asset.path)}
                >
                  {asset.type.startsWith('image/') ? (
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FolderOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Copy className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-0.5">
                    <p className="text-xs text-white truncate">{asset.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
