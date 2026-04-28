import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIDEStore } from '@/store/useIDEStore';
import type { FileNode } from '@/types';

function FileTreeItem({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const { activeFile, setActiveFile, deleteFile } = useIDEStore();

  const isActive = activeFile === node.path;

  if (node.type === 'directory') {
    return (
      <div>
        <button
          className={cn(
            'flex items-center w-full px-2 py-1 text-sm hover:bg-accent/50 rounded text-left gap-1',
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          {expanded ? (
            <FolderOpen className="w-4 h-4 text-blue-400" />
          ) : (
            <Folder className="w-4 h-4 text-blue-400" />
          )}
          <span className="text-muted-foreground">{node.name}</span>
        </button>
        {expanded && node.children?.map((child) => (
          <FileTreeItem key={child.path} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <button
      className={cn(
        'flex items-center w-full px-2 py-1 text-sm hover:bg-accent/50 rounded text-left gap-1 group',
        isActive && 'bg-accent text-accent-foreground'
      )}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
      onClick={() => setActiveFile(node.path)}
    >
      <FileCode className="w-4 h-4 text-orange-400 shrink-0" />
      <span className="truncate flex-1">{node.name}</span>
      <Trash2
        className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          deleteFile(node.path);
        }}
      />
    </button>
  );
}

export function FileTree() {
  const { files, addFile } = useIDEStore();
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      const path = newFileName.includes('/') ? newFileName : `src/${newFileName}`;
      addFile(path, '// New file\n');
      setNewFileName('');
      setShowNewFile(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Explorer</span>
        <button
          className="p-1 hover:bg-accent rounded"
          onClick={() => setShowNewFile(!showNewFile)}
        >
          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      {showNewFile && (
        <div className="px-2 py-1 border-b border-border">
          <input
            className="w-full bg-input border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="src/NewFile.tsx"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
            autoFocus
          />
        </div>
      )}
      <div className="flex-1 overflow-auto py-1">
        {files.map((node) => (
          <FileTreeItem key={node.path} node={node} />
        ))}
      </div>
    </div>
  );
}
