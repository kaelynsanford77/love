import { useState } from 'react'
import ReactDiffViewer from 'react-diff-viewer-continued'
import { X, File, ChevronDown, ChevronRight } from 'lucide-react'

interface FileDiff {
  path: string
  oldContent: string
  newContent: string
}

interface DiffViewProps {
  diffs: FileDiff[]
  onClose: () => void
  onApply?: () => void
  onRevert?: () => void
}

export default function DiffView({ diffs, onClose, onApply, onRevert }: DiffViewProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set(diffs.map(d => d.path)))

  function toggleFile(path: string) {
    setExpandedFiles(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <div>
            <h2 className="text-base font-semibold">Changes</h2>
            <p className="text-xs text-[#555] mt-0.5">{diffs.length} file{diffs.length !== 1 ? 's' : ''} modified</p>
          </div>
          <div className="flex items-center gap-2">
            {onRevert && (
              <button onClick={onRevert} className="px-4 py-2 rounded-lg text-sm border border-[#2a2a2a] text-[#888] hover:text-[#e8e8e8] transition-colors">
                Revert
              </button>
            )}
            {onApply && (
              <button onClick={onApply} className="px-4 py-2 rounded-lg text-sm text-white transition-all" style={{ background: 'oklch(0.55 0.18 265)' }}>
                Apply
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#e8e8e8]">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {diffs.map(diff => {
            const isExpanded = expandedFiles.has(diff.path)
            const additions = (diff.newContent.match(/\n/g) || []).length - (diff.oldContent.match(/\n/g) || []).length
            return (
              <div key={diff.path} className="border-b border-[#2a2a2a] last:border-0">
                <button
                  onClick={() => toggleFile(diff.path)}
                  className="w-full flex items-center gap-3 px-6 py-3 hover:bg-[#1f1f1f] transition-colors"
                >
                  {isExpanded ? <ChevronDown size={14} className="text-[#555]" /> : <ChevronRight size={14} className="text-[#555]" />}
                  <File size={14} className="text-[#555]" />
                  <span className="text-sm font-mono text-[#888]">{diff.path}</span>
                  {additions !== 0 && (
                    <span className={`ml-2 text-xs ${additions > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {additions > 0 ? `+${additions}` : additions}
                    </span>
                  )}
                </button>
                {isExpanded && (
                  <div className="text-xs">
                    <ReactDiffViewer
                      oldValue={diff.oldContent}
                      newValue={diff.newContent}
                      splitView={false}
                      useDarkTheme={true}
                      styles={{
                        variables: {
                          dark: {
                            diffViewerBackground: '#0a0a0a',
                            addedBackground: '#0d2b1a',
                            removedBackground: '#2b0d0d',
                            wordAddedBackground: '#1a4a2a',
                            wordRemovedBackground: '#4a1a1a',
                            addedGutterBackground: '#0d2b1a',
                            removedGutterBackground: '#2b0d0d',
                            gutterBackground: '#111',
                            gutterColor: '#555',
                            codeFoldBackground: '#111',
                            codeFoldContentColor: '#555',
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
