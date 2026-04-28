import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useProject } from '../hooks/useProject'
import { useChat } from '../hooks/useChat'
import { useFileTree } from '../hooks/useFileTree'
import Toolbar from './Toolbar'
import FileTree from './FileTree'
import ChatPanel from './ChatPanel'
import CodePanel from './CodePanel'
import PreviewPanel from './PreviewPanel'
import Terminal from './Terminal'
import GitHistory from './GitHistory'
import CommandPalette from './CommandPalette'
import { fsApi } from '../lib/api'
import type { ViewMode } from '../types'

export default function IDE() {
  const { id: projectId } = useParams<{ id: string }>()
  const { project, loading, update } = useProject(projectId)
  const chatState = useChat(projectId)
  const fileTreeState = useFileTree(projectId)

  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [openFiles, setOpenFiles] = useState<string[]>([])
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set())
  const [showTerminal, setShowTerminal] = useState(false)
  const [showGitHistory, setShowGitHistory] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [previewPort, setPreviewPort] = useState(5174)

  // Load chat history and file tree on mount
  useEffect(() => {
    if (projectId) {
      chatState.loadHistory()
      fileTreeState.loadTree()
    }
  }, [projectId])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && activeFile && projectId) {
        e.preventDefault()
        saveFile(activeFile, fileContent)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeFile, fileContent, projectId])

  const openFile = useCallback(async (filePath: string) => {
    if (!projectId) return
    try {
      const data = await fsApi.read(projectId, filePath)
      setActiveFile(filePath)
      setFileContent(data.content)
      setOpenFiles(prev => prev.includes(filePath) ? prev : [...prev, filePath])
      if (viewMode === 'chat') setViewMode('code')
    } catch {}
  }, [projectId, viewMode])

  const saveFile = useCallback(async (filePath: string, content: string) => {
    if (!projectId) return
    try {
      await fsApi.write(projectId, filePath, content)
      setDirtyFiles(prev => { const next = new Set(prev); next.delete(filePath); return next })
      fileTreeState.loadTree()
    } catch {}
  }, [projectId])

  const closeFile = useCallback((filePath: string) => {
    setOpenFiles(prev => {
      const next = prev.filter(f => f !== filePath)
      if (activeFile === filePath) {
        setActiveFile(next[next.length - 1] || null)
      }
      return next
    })
    setDirtyFiles(prev => { const next = new Set(prev); next.delete(filePath); return next })
  }, [activeFile])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#555] text-sm">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <p className="text-[#555]">Project not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f] overflow-hidden">
      <Toolbar
        project={project}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNameChange={(name) => update({ name })}
        onShowGitHistory={() => setShowGitHistory(true)}
        previewPort={previewPort}
        projectId={projectId!}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - file tree */}
        <div className="w-60 flex-shrink-0 border-r border-[#2a2a2a] flex flex-col overflow-hidden">
          <FileTree
            tree={fileTreeState.tree}
            loading={fileTreeState.loading}
            expandedPaths={fileTreeState.expandedPaths}
            activeFile={activeFile}
            projectId={projectId!}
            onFileClick={openFile}
            onToggleExpand={fileTreeState.toggleExpand}
            onCreateFile={fileTreeState.createFile}
            onCreateDir={fileTreeState.createDir}
            onDeleteFile={fileTreeState.deleteFile}
            onRenameFile={fileTreeState.renameFile}
            onRefresh={fileTreeState.loadTree}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Content area */}
          <div className={`flex-1 flex flex-col overflow-hidden transition-all ${viewMode === 'chat' ? '' : ''}`}>
            {viewMode === 'preview' ? (
              <PreviewPanel port={previewPort} projectId={projectId!} onPortChange={setPreviewPort} />
            ) : viewMode === 'code' || openFiles.length > 0 ? (
              <CodePanel
                projectId={projectId!}
                openFiles={openFiles}
                activeFile={activeFile}
                fileContent={fileContent}
                dirtyFiles={dirtyFiles}
                onFileSelect={openFile}
                onFileClose={closeFile}
                onContentChange={(content) => {
                  setFileContent(content)
                  if (activeFile) setDirtyFiles(prev => new Set([...prev, activeFile]))
                }}
                onSave={saveFile}
                onSendToChat={(text) => {
                  setViewMode('chat')
                  chatState.sendMessage(`Here's a code selection I'd like help with:\n\`\`\`\n${text}\n\`\`\``)
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#333]">
                <div className="text-center">
                  <div className="text-5xl mb-4">⚛️</div>
                  <p className="text-sm">Select a file to edit, or use the chat to build</p>
                </div>
              </div>
            )}

            {/* Terminal drawer */}
            {showTerminal && (
              <Terminal
                projectId={projectId!}
                onClose={() => setShowTerminal(false)}
              />
            )}
          </div>

          {/* Right sidebar - chat */}
          <div className="w-[360px] flex-shrink-0 border-l border-[#2a2a2a] flex flex-col overflow-hidden">
            <ChatPanel
              projectId={projectId!}
              messages={chatState.messages}
              isStreaming={chatState.isStreaming}
              onSendMessage={chatState.sendMessage}
              onStopStreaming={chatState.stopStreaming}
              onClearHistory={chatState.clearHistory}
              onOpenFile={openFile}
            />
          </div>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="border-t border-[#2a2a2a] px-4 py-1 flex items-center gap-2 text-xs text-[#555]">
        <button
          onClick={() => setShowTerminal(!showTerminal)}
          className="hover:text-[#888] transition-colors px-2 py-0.5 rounded hover:bg-[#1a1a1a]"
        >
          Terminal
        </button>
        <button
          onClick={() => setShowGitHistory(!showGitHistory)}
          className="hover:text-[#888] transition-colors px-2 py-0.5 rounded hover:bg-[#1a1a1a]"
        >
          Git History
        </button>
        {project.git_sha && (
          <span className="ml-auto font-mono text-[#444]">{project.git_sha.slice(0, 7)}</span>
        )}
      </div>

      {/* Git History Modal */}
      {showGitHistory && (
        <GitHistory
          projectId={projectId!}
          onClose={() => setShowGitHistory(false)}
        />
      )}

      {/* Command Palette */}
      {showCommandPalette && (
        <CommandPalette
          projectId={projectId!}
          onClose={() => setShowCommandPalette(false)}
          onOpenFile={openFile}
          onViewModeChange={setViewMode}
        />
      )}
    </div>
  )
}
