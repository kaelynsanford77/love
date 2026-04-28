import React, { useState, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { FileCode, ChevronRight, ChevronDown, X, Save, Folder, FolderOpen } from "lucide-react";
import type { Project, FileNode } from "../types";
import type { Toast } from "../types";
import { getProjectFiles, readFile, writeFile } from "../api";
import { cn, getLanguageFromPath } from "../utils";

interface EditorPanelProps {
  project: Project | null;
  onToast: (toast: Omit<Toast, "id">) => void;
  isMobile: boolean;
}

interface OpenTab {
  path: string;
  name: string;
  content: string;
  dirty: boolean;
  language: string;
}

function FileTreeNode({
  node,
  depth,
  onSelect,
  activeFile,
}: {
  node: FileNode;
  depth: number;
  onSelect: (node: FileNode) => void;
  activeFile: string | null;
}) {
  const [open, setOpen] = useState(depth === 0);

  if (node.type === "directory") {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 w-full px-2 py-0.5 hover:bg-[#1a1a1d] text-left transition-colors"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          {open ? (
            <ChevronDown size={12} className="text-[#9898a5] flex-shrink-0" />
          ) : (
            <ChevronRight size={12} className="text-[#9898a5] flex-shrink-0" />
          )}
          {open ? (
            <FolderOpen size={13} className="text-brand-400 flex-shrink-0" />
          ) : (
            <Folder size={13} className="text-brand-400 flex-shrink-0" />
          )}
          <span className="text-xs text-[#e8e8ed] truncate">{node.name}</span>
        </button>
        {open &&
          node.children?.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              activeFile={activeFile}
            />
          ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node)}
      className={cn(
        "flex items-center gap-1.5 w-full px-2 py-0.5 text-left transition-colors text-xs truncate",
        activeFile === node.path
          ? "bg-[#242428] text-white"
          : "text-[#9898a5] hover:bg-[#1a1a1d] hover:text-[#e8e8ed]"
      )}
      style={{ paddingLeft: `${20 + depth * 12}px` }}
    >
      <FileCode size={12} className="flex-shrink-0 text-[#9898a5]" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function EditorPanel({ project, onToast, isMobile }: EditorPanelProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showTree, setShowTree] = useState(!isMobile);

  const loadTree = useCallback(async () => {
    if (!project) return;
    try {
      const data = await getProjectFiles(project.id);
      setFileTree(Array.isArray(data) ? data : []);
    } catch {
      onToast({ type: "error", title: "Could not load files" });
    }
  }, [project, onToast]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const openFile = useCallback(
    async (node: FileNode) => {
      if (!project) return;
      const existing = tabs.find((t) => t.path === node.path);
      if (existing) {
        setActiveTab(node.path);
        return;
      }
      try {
        const data = await readFile(project.id, node.path);
        const tab: OpenTab = {
          path: node.path,
          name: node.name,
          content: data.content ?? "",
          dirty: false,
          language: getLanguageFromPath(node.path),
        };
        setTabs((prev) => [...prev, tab]);
        setActiveTab(node.path);
      } catch {
        onToast({ type: "error", title: "Could not read file" });
      }
    },
    [project, tabs, onToast]
  );

  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = tabs.findIndex((t) => t.path === path);
    setTabs((prev) => prev.filter((t) => t.path !== path));
    if (activeTab === path) {
      const next = tabs[idx + 1] ?? tabs[idx - 1];
      setActiveTab(next?.path ?? null);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setTabs((prev) =>
      prev.map((t) => (t.path === activeTab ? { ...t, content: value, dirty: true } : t))
    );
  };

  const saveFile = useCallback(async () => {
    if (!project || !activeTab) return;
    const tab = tabs.find((t) => t.path === activeTab);
    if (!tab) return;
    try {
      await writeFile(project.id, tab.path, tab.content);
      setTabs((prev) => prev.map((t) => (t.path === activeTab ? { ...t, dirty: false } : t)));
      onToast({ type: "success", title: `Saved ${tab.name}` });
    } catch {
      onToast({ type: "error", title: "Failed to save file" });
    }
  }, [project, activeTab, tabs, onToast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveFile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveFile]);

  const activeTabData = tabs.find((t) => t.path === activeTab);

  return (
    <div className="flex h-full flex-1 bg-[#0f0f10] overflow-hidden">
      {/* File Tree */}
      {showTree && (
        <div className="w-48 flex-shrink-0 border-r border-[#2d2d32] overflow-y-auto">
          <div className="px-2 py-2 border-b border-[#2d2d32]">
            <span className="text-[10px] font-semibold text-[#9898a5] uppercase tracking-wider">
              Explorer
            </span>
          </div>
          {fileTree.length === 0 ? (
            <div className="p-3 text-xs text-[#9898a5] text-center">
              {project ? "No files yet" : "No project"}
            </div>
          ) : (
            <div className="py-1">
              {fileTree.map((node) => (
                <FileTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  onSelect={openFile}
                  activeFile={activeTab}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-[#2d2d32] bg-[#0f0f10] overflow-x-auto flex-shrink-0">
          {tabs.map((tab) => (
            <div
              key={tab.path}
              onClick={() => setActiveTab(tab.path)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer border-r border-[#2d2d32] flex-shrink-0 group transition-colors",
                activeTab === tab.path
                  ? "bg-[#0f0f10] text-white border-t-2 border-t-brand-500"
                  : "bg-[#1a1a1d] text-[#9898a5] hover:text-[#e8e8ed]"
              )}
            >
              <FileCode size={11} />
              <span className="max-w-[100px] truncate">{tab.name}</span>
              {tab.dirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
              )}
              <button
                onClick={(e) => closeTab(tab.path, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity ml-0.5"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          {tabs.length === 0 && (
            <span className="px-3 py-2 text-xs text-[#9898a5]">
              {project ? "Select a file to edit" : "No project selected"}
            </span>
          )}
          <div className="flex-1" />
          {activeTabData?.dirty && (
            <button
              onClick={saveFile}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors border-l border-[#2d2d32]"
            >
              <Save size={12} />
              Save
            </button>
          )}
        </div>

        {/* Monaco Editor */}
        {activeTabData ? (
          <div className="flex-1 overflow-hidden">
            <Editor
              value={activeTabData.content}
              language={activeTabData.language}
              theme="vs-dark"
              onChange={handleEditorChange}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 2,
                padding: { top: 12 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                renderLineHighlight: "line",
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <FileCode size={40} className="text-[#2d2d32] mx-auto mb-3" />
              <p className="text-sm text-[#9898a5]">No file open</p>
              <p className="text-xs text-[#9898a5] mt-1 opacity-60">
                Select a file from the explorer
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
