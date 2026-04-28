import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart, ChevronLeft, Share2, Rocket, MoreHorizontal,
  Code2, MessageSquare, Eye, History, Terminal,
  Moon, Sun, Smartphone, Monitor, Tablet
} from 'lucide-react'
import { previewApi } from '../lib/api'
import { toast } from 'sonner'
import type { Project, ViewMode } from '../types'

interface ToolbarProps {
  project: Project
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onNameChange: (name: string) => void
  onShowGitHistory: () => void
  previewPort: number
  projectId: string
}

export default function Toolbar({
  project,
  viewMode,
  onViewModeChange,
  onNameChange,
  onShowGitHistory,
  previewPort,
  projectId,
}: ToolbarProps) {
  const navigate = useNavigate()
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(project.name)
  const [showOverflow, setShowOverflow] = useState(false)

  async function handleShare() {
    try {
      const { url } = await previewApi.share(projectId)
      await navigator.clipboard.writeText(url)
      toast.success('Share link copied to clipboard')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  function handleNameBlur() {
    setEditingName(false)
    if (nameValue.trim() && nameValue !== project.name) {
      onNameChange(nameValue.trim())
    } else {
      setNameValue(project.name)
    }
  }

  return (
    <div className="border-b border-[#2a2a2a] px-4 py-2 flex items-center gap-3 flex-shrink-0 bg-[#0f0f0f]">
      {/* Logo + back */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/')} className="p-1.5 rounded hover:bg-[#1a1a1a] text-[#666] hover:text-[#e8e8e8] transition-colors">
          <ChevronLeft size={16} />
        </button>
        <Heart className="text-purple-400 fill-purple-400 flex-shrink-0" size={18} />
      </div>

      {/* Project name */}
      <div className="flex items-center">
        {editingName ? (
          <input
            autoFocus
            type="text"
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={e => {
              if (e.key === 'Enter') handleNameBlur()
              if (e.key === 'Escape') { setNameValue(project.name); setEditingName(false) }
            }}
            className="bg-transparent border-b border-purple-500 text-sm font-medium text-[#e8e8e8] outline-none px-1 min-w-[120px]"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-medium text-[#e8e8e8] hover:text-white px-1 py-0.5 rounded hover:bg-[#1a1a1a] transition-colors"
          >
            {project.name}
          </button>
        )}
      </div>

      {/* View mode switcher */}
      <div className="flex items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5 mx-2">
        {([
          { mode: 'chat' as ViewMode, icon: MessageSquare, label: 'Chat' },
          { mode: 'code' as ViewMode, icon: Code2, label: 'Code' },
          { mode: 'preview' as ViewMode, icon: Eye, label: 'Preview' },
        ] as const).map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === mode
                ? 'bg-[#2a2a2a] text-[#e8e8e8]'
                : 'text-[#666] hover:text-[#888]'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onShowGitHistory}
          title="Git history"
          className="p-2 rounded-lg text-[#666] hover:text-[#e8e8e8] hover:bg-[#1a1a1a] transition-colors"
        >
          <History size={16} />
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-[#2a2a2a] text-[#888] hover:text-[#e8e8e8] hover:border-[#3a3a3a] transition-all"
        >
          <Share2 size={14} />
          Share
        </button>

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all"
          style={{ background: 'oklch(0.55 0.18 265)' }}
          onClick={() => toast.info('Deploy feature coming soon!')}
        >
          <Rocket size={14} />
          Deploy
        </button>

        <div className="relative">
          <button
            onClick={() => setShowOverflow(!showOverflow)}
            className="p-2 rounded-lg text-[#666] hover:text-[#e8e8e8] hover:bg-[#1a1a1a] transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>

          {showOverflow && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowOverflow(false)} />
              <div className="absolute right-0 top-full mt-1 w-52 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                {[
                  { label: 'Open in new tab', icon: Eye, action: () => window.open(`http://localhost:${previewPort}`, '_blank') },
                  { label: 'Git History', icon: History, action: onShowGitHistory },
                  { label: 'Terminal', icon: Terminal, action: () => {} },
                ].map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    onClick={() => { action(); setShowOverflow(false) }}
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
      </div>
    </div>
  )
}
