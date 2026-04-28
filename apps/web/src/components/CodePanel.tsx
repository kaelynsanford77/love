import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import {
  X, Save, MoreHorizontal, MessageSquare, FileCode2,
  ChevronDown
} from 'lucide-react'
import { getLanguageFromExt } from '../lib/utils'
import { fsApi } from '../lib/api'
import { toast } from 'sonner'

interface CodePanelProps {
  projectId: string
  openFiles: string[]
  activeFile: string | null
  fileContent: string
  dirtyFiles: Set<string>
  onFileSelect: (path: string) => void
  onFileClose: (path: string) => void
  onContentChange: (content: string) => void
  onSave: (path: string, content: string) => void
  onSendToChat: (text: string) => void
}

export default function CodePanel({
  projectId,
  openFiles,
  activeFile,
  fileContent,
  dirtyFiles,
  onFileSelect,
  onFileClose,
  onContentChange,
  onSave,
  onSendToChat,
}: CodePanelProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string } | null>(null)
  const editorRef = useRef<any>(null)

  const language = activeFile
    ? getLanguageFromExt(activeFile.split('.').pop() || '')
    : 'plaintext'

  function handleEditorMount(editor: any) {
    editorRef.current = editor

    // Right-click context menu
    editor.onContextMenu((e: any) => {
      const selection = editor.getSelection()
      const text = selection ? editor.getModel()?.getValueInRange(selection) : ''
      if (text) {
        e.event.preventDefault()
        setContextMenu({
          x: e.event.posx,
          y: e.event.posy,
          text,
        })
      }
    })

    editor.addAction({
      id: 'send-to-chat',
      label: 'Send to Chat',
      keybindings: [],
      run: () => {
        const selection = editor.getSelection()
        const text = selection ? editor.getModel()?.getValueInRange(selection) : ''
        if (text) onSendToChat(text)
      },
    })
  }

  function handleSave() {
    if (!activeFile) return
    onSave(activeFile, fileContent)
    toast.success('Saved')
  }

  return (
    <div className="flex flex-col h-full" onClick={() => setContextMenu(null)}>
      {/* Tabs */}
      <div className="flex items-center border-b border-[#2a2a2a] overflow-x-auto flex-shrink-0 bg-[#0f0f0f]">
        {openFiles.map(file => {
          const name = file.split('/').pop() || file
          const isDirty = dirtyFiles.has(file)
          const isActive = activeFile === file

          return (
            <div
              key={file}
              className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer border-r border-[#2a2a2a] flex-shrink-0 transition-colors text-xs ${
                isActive
                  ? 'bg-[#1a1a1a] text-[#e8e8e8] border-b border-b-purple-500'
                  : 'text-[#666] hover:text-[#888] hover:bg-[#111]'
              }`}
              onClick={() => onFileSelect(file)}
            >
              {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
              <span className="font-mono">{name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onFileClose(file) }}
                className="p-0.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#888]"
              >
                <X size={11} />
              </button>
            </div>
          )
        })}
      </div>

      {/* File path breadcrumb */}
      {activeFile && (
        <div className="px-4 py-1.5 border-b border-[#2a2a2a] flex items-center justify-between bg-[#0d0d0d]">
          <span className="text-xs text-[#555] font-mono">{activeFile}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { if (activeFile) onSendToChat(`Please review this file: ${activeFile}`) }}
              className="p-1.5 rounded text-[#555] hover:text-[#888] hover:bg-[#1a1a1a] transition-colors"
              title="Send to chat"
            >
              <MessageSquare size={13} />
            </button>
            <button
              onClick={handleSave}
              className="p-1.5 rounded text-[#555] hover:text-[#888] hover:bg-[#1a1a1a] transition-colors"
              title="Save (Ctrl+S)"
            >
              <Save size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          <Editor
            height="100%"
            language={language}
            value={fileContent}
            onMount={handleEditorMount}
            onChange={(value) => onContentChange(value || '')}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              lineHeight: 1.6,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: true,
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              bracketPairColorization: { enabled: true },
              padding: { top: 16, bottom: 16 },
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
              },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              renderLineHighlight: 'none',
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#333] h-full">
            <div className="text-center">
              <FileCode2 size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No file open</p>
            </div>
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl py-1 min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {[
              { label: 'Send to Chat', icon: MessageSquare, action: () => onSendToChat(contextMenu.text) },
            ].map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                onClick={() => { action(); setContextMenu(null) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#888] hover:text-[#e8e8e8] hover:bg-[#2a2a2a] transition-colors"
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
