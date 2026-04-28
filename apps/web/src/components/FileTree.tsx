import { useState, useRef, useEffect } from 'react'
import {
  ChevronRight, ChevronDown, File, Folder, FolderOpen,
  Plus, FilePlus, FolderPlus, MoreHorizontal, RefreshCw,
  Pencil, Trash2, X, Check, Image, FileCode2
} from 'lucide-react'
import { cn, getFileIcon } from '../lib/utils'
import type { FileNode } from '../types'

interface FileTreeProps {
  tree: FileNode[]
  loading: boolean
  expandedPaths: Set<string>
  activeFile: string | null
  projectId: string
  onFileClick: (path: string) => void
  onToggleExpand: (path: string) => void
  onCreateFile: (path: string, content?: string) => void
  onCreateDir: (path: string) => void
  onDeleteFile: (path: string) => void
  onRenameFile: (oldPath: string, newPath: string) => void
  onRefresh: () => void
}

export default function FileTree({
  tree,
  loading,
  expandedPaths,
  activeFile,
  projectId,
  onFileClick,
  onToggleExpand,
  onCreateFile,
  onCreateDir,
  onDeleteFile,
  onRenameFile,
  onRefresh,
}: FileTreeProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; node?: FileNode; parentPath?: string
  } | null>(null)
  const [creating, setCreating] = useState<{ parentPath: string; type: 'file' | 'dir' } | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  function handleContextMenu(e: React.MouseEvent, node?: FileNode) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }

  function startCreate(type: 'file' | 'dir', parentPath = '') {
    setCreating({ parentPath, type })
    setNewName('')
    setContextMenu(null)
  }

  function startRename(node: FileNode) {
    setRenaming(node.path)
    setNewName(node.name)
    setContextMenu(null)
  }

  function commitCreate() {
    if (!creating || !newName.trim()) { setCreating(null); return }
    const fullPath = creating.parentPath ? `${creating.parentPath}/${newName.trim()}` : newName.trim()
    if (creating.type === 'file') {
      onCreateFile(fullPath)
    } else {
      onCreateDir(fullPath)
    }
    setCreating(null)
  }

  function commitRename(node: FileNode) {
    if (!newName.trim() || newName === node.name) { setRenaming(null); return }
    const dir = node.path.includes('/') ? node.path.slice(0, node.path.lastIndexOf('/') + 1) : ''
    onRenameFile(node.path, dir + newName.trim())
    setRenaming(null)
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      onContextMenu={(e) => handleContextMenu(e)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a] flex-shrink-0">
        <span className="text-xs font-medium text-[#555] uppercase tracking-wider">Files</span>
        <div className="flex items-center gap-1">
          <button onClick={() => startCreate('file')} className="p-1 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#888]" title="New file">
            <FilePlus size={13} />
          </button>
          <button onClick={() => startCreate('dir')} className="p-1 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#888]" title="New folder">
            <FolderPlus size={13} />
          </button>
          <button onClick={onRefresh} className="p-1 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#888]" title="Refresh">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Root-level create input */}
        {creating && creating.parentPath === '' && (
          <CreateInput
            type={creating.type}
            value={newName}
            onChange={setNewName}
            onCommit={commitCreate}
            onCancel={() => setCreating(null)}
            depth={0}
          />
        )}

        {tree.map(node => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            activeFile={activeFile}
            expandedPaths={expandedPaths}
            creating={creating}
            renaming={renaming}
            newName={newName}
            onFileClick={onFileClick}
            onToggleExpand={onToggleExpand}
            onContextMenu={handleContextMenu}
            onSetNewName={setNewName}
            onCommitCreate={commitCreate}
            onCancelCreate={() => setCreating(null)}
            onCommitRename={commitRename}
            onCancelRename={() => setRenaming(null)}
          />
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl py-1 min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.node?.type === 'directory' || !contextMenu.node ? (
              <>
                <ContextMenuItem icon={FilePlus} label="New File" onClick={() => startCreate('file', contextMenu.node?.path || '')} />
                <ContextMenuItem icon={FolderPlus} label="New Folder" onClick={() => startCreate('dir', contextMenu.node?.path || '')} />
              </>
            ) : null}
            {contextMenu.node && (
              <>
                <div className="border-t border-[#2a2a2a] my-1" />
                <ContextMenuItem icon={Pencil} label="Rename" onClick={() => startRename(contextMenu.node!)} />
                <ContextMenuItem icon={Trash2} label="Delete" className="text-red-400" onClick={() => { onDeleteFile(contextMenu.node!.path); setContextMenu(null) }} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function TreeNode({
  node, depth, activeFile, expandedPaths, creating, renaming, newName,
  onFileClick, onToggleExpand, onContextMenu, onSetNewName,
  onCommitCreate, onCancelCreate, onCommitRename, onCancelRename,
}: {
  node: FileNode; depth: number; activeFile: string | null
  expandedPaths: Set<string>; creating: any; renaming: string | null; newName: string
  onFileClick: (p: string) => void; onToggleExpand: (p: string) => void
  onContextMenu: (e: React.MouseEvent, node?: FileNode) => void
  onSetNewName: (n: string) => void; onCommitCreate: () => void; onCancelCreate: () => void
  onCommitRename: (n: FileNode) => void; onCancelRename: () => void
}) {
  const isExpanded = expandedPaths.has(node.path)
  const isActive = activeFile === node.path
  const isRenaming = renaming === node.path

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 cursor-pointer text-xs select-none rounded mx-1 transition-colors',
          isActive ? 'bg-[#2a2a2a] text-[#e8e8e8]' : 'text-[#888] hover:bg-[#1a1a1a] hover:text-[#bbb]'
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => {
          if (node.type === 'directory') onToggleExpand(node.path)
          else onFileClick(node.path)
        }}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        {node.type === 'directory' ? (
          <>
            {isExpanded ? <ChevronDown size={12} className="flex-shrink-0 text-[#555]" /> : <ChevronRight size={12} className="flex-shrink-0 text-[#555]" />}
            {isExpanded ? <FolderOpen size={13} className="flex-shrink-0 text-amber-400/70" /> : <Folder size={13} className="flex-shrink-0 text-amber-400/70" />}
          </>
        ) : (
          <span className="ml-4 text-[11px] flex-shrink-0">{getFileIcon(node.name)}</span>
        )}

        {isRenaming ? (
          <input
            autoFocus
            value={newName}
            onChange={e => onSetNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onCommitRename(node)
              if (e.key === 'Escape') onCancelRename()
            }}
            onBlur={() => onCommitRename(node)}
            className="flex-1 bg-[#2a2a2a] rounded px-1 text-[#e8e8e8] outline-none text-xs"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="truncate font-mono">{node.name}</span>
        )}
      </div>

      {node.type === 'directory' && isExpanded && (
        <div>
          {creating && creating.parentPath === node.path && (
            <CreateInput
              type={creating.type}
              value={newName}
              onChange={onSetNewName}
              onCommit={onCommitCreate}
              onCancel={onCancelCreate}
              depth={depth + 1}
            />
          )}
          {(node.children || []).map(child => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              expandedPaths={expandedPaths}
              creating={creating}
              renaming={renaming}
              newName={newName}
              onFileClick={onFileClick}
              onToggleExpand={onToggleExpand}
              onContextMenu={onContextMenu}
              onSetNewName={onSetNewName}
              onCommitCreate={onCommitCreate}
              onCancelCreate={onCancelCreate}
              onCommitRename={onCommitRename}
              onCancelRename={onCancelRename}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CreateInput({ type, value, onChange, onCommit, onCancel, depth }: {
  type: 'file' | 'dir'; value: string; onChange: (v: string) => void
  onCommit: () => void; onCancel: () => void; depth: number
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 mx-1" style={{ paddingLeft: `${depth * 14 + 8}px` }}>
      <span className="text-[11px]">{type === 'dir' ? '📁' : '📄'}</span>
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') onCommit()
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={onCommit}
        placeholder={type === 'file' ? 'filename.tsx' : 'foldername'}
        className="flex-1 bg-[#2a2a2a] rounded px-2 py-0.5 text-xs text-[#e8e8e8] outline-none border border-purple-500/50"
      />
    </div>
  )
}

function ContextMenuItem({ icon: Icon, label, onClick, className = '' }: {
  icon: any; label: string; onClick: () => void; className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#2a2a2a] transition-colors', className || 'text-[#888] hover:text-[#e8e8e8]')}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}
