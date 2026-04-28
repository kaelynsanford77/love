import { useState, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { ChevronRight, File, Folder, FolderOpen, Save, X } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface CodePanelProps {
  projectId: string | null;
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileNode[];
}

export function CodePanel({ projectId }: CodePanelProps) {
  const { tabs, activeTabId, setActiveTab, closeTab, openFile, updateContent, markSaved, fontSize, theme, minimap, wordWrap, tabSize } = useEditorStore();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["src"]));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    api.get<{ tree: FileNode[] }>(`/files/${projectId}/tree`)
      .then(({ tree }) => setFileTree(tree))
      .catch(() => {});
  }, [projectId]);

  const projectTabs = tabs.filter((t) => t.projectId === projectId);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleFileClick = async (node: FileNode) => {
    if (!projectId || node.type !== "file") return;
    try {
      const { content } = await api.get<{ content: string }>(
        `/files/${projectId}/read?path=${encodeURIComponent(node.path)}`
      );
      openFile(projectId, node.path, content);
    } catch (e) {
      toast.error(`Failed to open file: ${e}`);
    }
  };

  const handleSave = useCallback(async () => {
    if (!activeTab || !projectId) return;
    try {
      await api.post(`/files/${projectId}/write`, {
        path: activeTab.filePath,
        content: activeTab.content,
      });
      markSaved(activeTab.id);
      toast.success("Saved", { duration: 1500 });
    } catch (e) {
      toast.error(`Save failed: ${e}`);
    }
  }, [activeTab, projectId, markSaved]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  if (!projectId) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <div className="text-5xl mb-4">📝</div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">No file open</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Select a file from the tree or ask AI to create something.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* File tree */}
      {!isMobile && (
        <div className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
            Explorer
          </div>
          <div className="py-1">
            {fileTree.map((node) => (
              <FileTreeNode
                key={node.path}
                node={node}
                depth={0}
                expandedDirs={expandedDirs}
                onToggle={(path) =>
                  setExpandedDirs((prev) => {
                    const next = new Set(prev);
                    if (next.has(path)) next.delete(path); else next.add(path);
                    return next;
                  })
                }
                onFileClick={handleFileClick}
                activePath={activeTab?.filePath}
              />
            ))}
          </div>
        </div>
      )}

      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        {projectTabs.length > 0 && (
          <div className="flex items-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-x-auto shrink-0">
            {projectTabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer border-r border-gray-200 dark:border-gray-800 shrink-0 group",
                  tab.id === activeTabId
                    ? "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <File size={12} />
                <span className="max-w-24 truncate">
                  {tab.filePath.split("/").pop()}
                </span>
                {tab.isDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Monaco editor */}
        {activeTab ? (
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              <button
                onClick={handleSave}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
                  activeTab.isDirty
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                )}
              >
                <Save size={11} />
                {activeTab.isDirty ? "Save" : "Saved"}
              </button>
            </div>
            <Editor
              height="100%"
              language={activeTab.language}
              value={activeTab.content}
              theme={theme}
              onChange={(val) => updateContent(activeTab.id, val || "")}
              options={{
                fontSize: isMobile ? 15 : fontSize,
                lineHeight: isMobile ? 24 : undefined,
                minimap: { enabled: minimap },
                wordWrap: wordWrap ? "on" : "off",
                tabSize,
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                renderLineHighlight: "all",
                smoothScrolling: true,
                cursorSmoothCaretAnimation: "on",
                fontFamily: "JetBrains Mono, Fira Code, monospace",
                fontLigatures: true,
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <div className="text-5xl mb-4">📄</div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">No file open</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Select a file from the tree.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
  expandedDirs: Set<string>;
  onToggle: (path: string) => void;
  onFileClick: (node: FileNode) => void;
  activePath?: string;
}

function FileTreeNode({ node, depth, expandedDirs, onToggle, onFileClick, activePath }: FileTreeNodeProps) {
  const isExpanded = expandedDirs.has(node.path);
  const isActive = node.path === activePath;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 cursor-pointer rounded-sm mx-1 text-xs transition-colors group",
          isActive
            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
        onClick={() => node.type === "dir" ? onToggle(node.path) : onFileClick(node)}
      >
        {node.type === "dir" ? (
          <>
            <ChevronRight
              size={12}
              className={cn("transition-transform shrink-0", isExpanded && "rotate-90")}
            />
            {isExpanded ? <FolderOpen size={13} className="text-yellow-500 shrink-0" /> : <Folder size={13} className="text-yellow-500 shrink-0" />}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <File size={13} className="shrink-0" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {node.type === "dir" && isExpanded && node.children?.map((child) => (
        <FileTreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          expandedDirs={expandedDirs}
          onToggle={onToggle}
          onFileClick={onFileClick}
          activePath={activePath}
        />
      ))}
    </div>
  );
}
