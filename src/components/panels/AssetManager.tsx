import React, { useCallback } from 'react';
import { Image, Upload, Trash2, Copy, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIDEStore } from '@/store/useIDEStore';

export function AssetManager() {
  const { assets, addAsset, removeAsset } = useIDEStore();

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            addAsset(file.name, ev.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      });
    },
    [addAsset]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          addAsset(file.name, ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    },
    [addAsset]
  );

  const copyPath = (path: string) => {
    navigator.clipboard?.writeText(`/${path}`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Drop zone */}
      <div
        className="m-2 border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById('asset-upload')?.click()}
      >
        <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          Drag images here or click to upload
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Files saved to public/ directory
        </p>
      </div>
      <input
        id="asset-upload"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Asset list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {assets.length === 0 ? (
            <div className="text-center py-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground">No assets yet</p>
            </div>
          ) : (
            assets.map((asset) => (
              <div
                key={asset.name}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent/50 rounded group"
              >
                {asset.dataUrl.startsWith('data:image/') ? (
                  <img
                    src={asset.dataUrl}
                    alt={asset.name}
                    className="w-8 h-8 object-cover rounded border border-border shrink-0"
                  />
                ) : (
                  <Image className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{asset.name}</p>
                  <p className="text-[10px] text-muted-foreground">/{asset.path}</p>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyPath(asset.path)}
                  title="Copy path"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeAsset(asset.name)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
