import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, File, Code2, Eye, MessageSquare, X } from 'lucide-react'
import { fsApi } from '../lib/api'
import type { FileNode, ViewMode } from '../types'

interface CommandPaletteProps {
  projectId: string
  onClose: () => void
  onOpenFile: (path: string) => void
  onViewModeChange: (mode: ViewMode) => void
}

interface Command {
  id: string
  label: string
  description?: string
  icon: any
  action: () => void
  category: string
}

export default function CommandPalette({ projectId, onClose, onOpenFile, onViewModeChange }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [files, setFiles] = useState<FileNode[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    loadFiles()
  }, [])

  async function loadFiles() {
    try {
      const { tree } = await fsApi.tree(projectId)
      setFiles(flattenTree(tree))
    } catch {}
  }

  function flattenTree(nodes: FileNode[]): FileNode[] {
    const result: FileNode[] = []
    for (const node of nodes) {
      if (node.type === 'file') result.push(node)
      if (node.children) result.push(...flattenTree(node.children))
    }
    return result
  }

  const staticCommands: Command[] = [
    {
      id: 'mode-chat',
      label: 'Switch to Chat',
      icon: MessageSquare,
      action: () => { onViewModeChange('chat'); onClose() },
      category: 'View',
    },
    {
      id: 'mode-code',
      label: 'Switch to Code',
      icon: Code2,
      action: () => { onViewModeChange('code'); onClose() },
      category: 'View',
    },
    {
      id: 'mode-preview',
      label: 'Switch to Preview',
      icon: Eye,
      action: () => { onViewModeChange('preview'); onClose() },
      category: 'View',
    },
    {
      id: 'back-dashboard',
      label: 'Go to Dashboard',
      icon: File,
      action: () => { navigate('/') },
      category: 'Navigation',
    },
  ]

  const fileCommands: Command[] = files
    .filter(f => !query || f.path.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10)
    .map(f => ({
      id: f.path,
      label: f.name,
      description: f.path,
      icon: File,
      action: () => { onOpenFile(f.path); onClose() },
      category: 'Files',
    }))

  const filteredStatic = query
    ? staticCommands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : staticCommands

  const allResults = [...filteredStatic, ...fileCommands]

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      allResults[selectedIndex]?.action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [allResults, selectedIndex, onClose])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a]">
          <Search size={16} className="text-[#555] flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files or commands..."
            className="flex-1 bg-transparent text-sm text-[#e8e8e8] placeholder-[#444] outline-none"
          />
          <kbd className="text-[10px] text-[#444] bg-[#2a2a2a] px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1">
          {allResults.length === 0 ? (
            <p className="text-center text-[#555] py-8 text-sm">No results</p>
          ) : (() => {
            const groups = allResults.reduce((acc, cmd, i) => {
              if (!acc[cmd.category]) acc[cmd.category] = []
              acc[cmd.category].push({ ...cmd, _index: i })
              return acc
            }, {} as Record<string, any[]>)

            return Object.entries(groups).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-[10px] text-[#444] font-medium uppercase tracking-wider">
                  {category}
                </div>
                {cmds.map((cmd: any) => (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      selectedIndex === cmd._index
                        ? 'bg-[#2a2a2a] text-[#e8e8e8]'
                        : 'text-[#888] hover:bg-[#1f1f1f] hover:text-[#e8e8e8]'
                    }`}
                  >
                    <cmd.icon size={14} className="flex-shrink-0 text-[#555]" />
                    <span className="flex-1 text-left">{cmd.label}</span>
                    {cmd.description && (
                      <span className="text-xs text-[#444] font-mono truncate max-w-[200px]">{cmd.description}</span>
                    )}
                  </button>
                ))}
              </div>
            ))
          })()}
        </div>
      </div>
    </div>
  )
}
