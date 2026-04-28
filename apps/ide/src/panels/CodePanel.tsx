import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { watchFiles } from '@/lib/ws';
import { getLanguage } from '@/lib/classify';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Editor from '@monaco-editor/react';
import {
  X,
  Save,
  FileCode,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  File,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

function FileTree({
  nodes,
  onSelect,
  selected,
}: {
  nodes: FileNode[];
  onSelect: (path: string) => void;
  selected: string | null;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['src']));

  const toggle = (path: string) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderNode = (node: FileNode, depth = 0) => {
    const isDir = node.type === 'directory';
    const isOpen = expanded.has(node.path);
    const isSelected = selected === node.path;

    return (
      <div key={node.path}>
        <button
          className={cn(
            'flex items-center gap-1.5 w-full text-left px-2 py-0.5 text-xs rounded hover:bg-muted/60 transition-colors',
            isSelected && 'bg-primary/10 text-primary',
            !isSelected && 'text-foreground/80'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (isDir) toggle(node.path);
            else onSelect(node.path);
          }}
        >
          {isDir ? (
            <>
              {isOpen ? (
                <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              )}
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-yellow-400/80" />
            </>
          ) : (
            <>
              <span className="w-3 shrink-0" />
              <FileCode className="h-3.5 w-3.5 shrink-0 text-blue-400/80" />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isDir && isOpen && node.children && (
          <div>{node.children.map((c) => renderNode(c, depth + 1))}</div>
        )}
      </div>
    );
  };

  return <div className="py-1">{nodes.map((n) => renderNode(n))}</div>;
}

export function CodePanel() {
  const { projectId, tabs, activeTab, openTab, closeTab, setActiveTab, updateTabContent } = useStore();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadTree = useCallback(async () => {
    setLoadingTree(true);
    try {
      const res = await api.get<{ tree: FileNode[] }>(
        `/fs/tree?projectId=${encodeURIComponent(projectId)}`
      );
      setFileTree(res.tree ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingTree(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTree();
    const unsub = watchFiles(projectId, () => loadTree());
    return unsub;
  }, [projectId, loadTree]);

  const openFile = async (path: string) => {
    const existing = tabs.find((t) => t.path === path);
    if (existing) {
      setActiveTab(path);
      return;
    }
    try {
      const res = await api.get<{ content: string }>(
        `/fs/file?projectId=${encodeURIComponent(projectId)}&path=${encodeURIComponent(path)}`
      );
      openTab(path, res.content ?? '', getLanguage(path));
    } catch {
      toast.error('Failed to open file');
    }
  };

  const saveFile = async () => {
    if (!activeTab) return;
    const tab = tabs.find((t) => t.path === activeTab);
    if (!tab) return;
    setSaving(true);
    try {
      await api.put('/fs/file', {
        projectId,
        path: activeTab,
        content: tab.content,
      });
      toast.success(`Saved ${activeTab.split('/').pop()}`);
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const activeTabData = tabs.find((t) => t.path === activeTab);

  return (
    <div className="flex h-full bg-background">
      {/* File tree sidebar */}
      <div className="w-52 shrink-0 border-r border-border flex flex-col">
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Files
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={loadTree}
            disabled={loadingTree}
          >
            <RefreshCw className={cn('h-3 w-3', loadingTree && 'animate-spin')} />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {fileTree.length === 0 && !loadingTree && (
            <div className="px-3 py-6 text-xs text-muted-foreground text-center">
              No files yet
            </div>
          )}
          <FileTree nodes={fileTree} onSelect={openFile} selected={activeTab} />
        </ScrollArea>
      </div>

      {/* Editor area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-border overflow-x-auto shrink-0 bg-muted/20">
          {tabs.map((tab) => (
            <div
              key={tab.path}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-border shrink-0 hover:bg-muted/40 transition-colors',
                activeTab === tab.path ? 'bg-background text-foreground border-t-2 border-t-primary' : 'text-muted-foreground'
              )}
              onClick={() => setActiveTab(tab.path)}
            >
              <File className="h-3 w-3 shrink-0" />
              <span className="max-w-[100px] truncate">{tab.path.split('/').pop()}</span>
              {tab.dirty && <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />}
              <button
                className="ml-0.5 rounded hover:bg-muted p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.path);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {tabs.length === 0 && (
            <div className="px-4 py-2 text-xs text-muted-foreground">Select a file to edit</div>
          )}
        </div>

        {/* Save bar */}
        {activeTabData?.dirty && (
          <div className="flex items-center justify-between px-3 py-1 bg-orange-900/20 border-b border-orange-800/30 shrink-0">
            <span className="text-xs text-orange-400">Unsaved changes</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1 text-xs text-orange-400 hover:text-orange-300"
              onClick={saveFile}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </Button>
          </div>
        )}

        {/* Monaco */}
        {activeTabData ? (
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={activeTabData.language ?? getLanguage(activeTabData.path)}
              value={activeTabData.content}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                padding: { top: 12, bottom: 12 },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                smoothScrolling: true,
                cursorSmoothCaretAnimation: 'on',
                tabSize: 2,
              }}
              onChange={(v) => updateTabContent(activeTabData.path, v ?? '')}
              onMount={(editor, monaco) => {
                editor.addCommand(
                  monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                  () => saveFile()
                );
              }}
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
            <div className="text-center">
              <FileCode className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Open a file from the tree to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
