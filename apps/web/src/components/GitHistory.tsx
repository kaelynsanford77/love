import { useState, useEffect } from 'react'
import { X, GitBranch, RotateCcw, GitFork, Clock, Hash, Loader2 } from 'lucide-react'
import { gitApi } from '../lib/api'
import { formatDate } from '../lib/utils'
import { toast } from 'sonner'
import type { GitCommit } from '../types'

interface GitHistoryProps {
  projectId: string
  onClose: () => void
}

export default function GitHistory({ projectId, onClose }: GitHistoryProps) {
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [branches, setBranches] = useState<{ current: string; branches: string[] }>({ current: 'main', branches: ['main'] })
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'commits' | 'branches'>('commits')

  useEffect(() => {
    loadData()
  }, [projectId])

  async function loadData() {
    setLoading(true)
    try {
      const [log, branchData] = await Promise.all([
        gitApi.log(projectId),
        gitApi.branches(projectId),
      ])
      setCommits(log)
      setBranches(branchData)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore(sha: string) {
    if (!confirm(`Restore to commit ${sha.slice(0, 7)}? Current changes will be preserved as a new commit.`)) return
    try {
      await gitApi.restore(projectId, sha)
      toast.success('Restored to commit ' + sha.slice(0, 7))
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleFork(sha: string) {
    try {
      const { branchName } = await gitApi.fork(projectId, sha)
      toast.success(`Created branch: ${branchName}`)
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleCheckout(branch: string) {
    try {
      await gitApi.checkout(projectId, branch)
      toast.success(`Switched to ${branch}`)
      loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">Git History</h2>
            <div className="flex items-center bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-0.5">
              <button
                onClick={() => setActiveView('commits')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeView === 'commits' ? 'bg-[#2a2a2a] text-[#e8e8e8]' : 'text-[#555]'}`}
              >
                Commits
              </button>
              <button
                onClick={() => setActiveView('branches')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeView === 'branches' ? 'bg-[#2a2a2a] text-[#e8e8e8]' : 'text-[#555]'}`}
              >
                Branches
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#e8e8e8]">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-[#555]" size={24} />
            </div>
          ) : activeView === 'commits' ? (
            <div className="divide-y divide-[#2a2a2a]">
              {commits.length === 0 ? (
                <p className="text-center text-[#555] py-12 text-sm">No commits yet</p>
              ) : commits.map((commit) => (
                <div key={commit.hash} className="flex items-start gap-4 px-6 py-4 hover:bg-[#1f1f1f] transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e8e8e8] font-medium truncate">{commit.message}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#555]">
                      <span className="flex items-center gap-1">
                        <Hash size={10} />
                        <span className="font-mono">{commit.hash.slice(0, 7)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatDate(commit.date)}
                      </span>
                      {commit.author && <span>{commit.author}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => handleRestore(commit.hash)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-[#2a2a2a] text-[#888] hover:text-[#e8e8e8] hover:bg-[#333] transition-colors"
                      title="Restore to this commit"
                    >
                      <RotateCcw size={11} />
                      Restore
                    </button>
                    <button
                      onClick={() => handleFork(commit.hash)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-[#2a2a2a] text-[#888] hover:text-[#e8e8e8] hover:bg-[#333] transition-colors"
                      title="Create branch from this commit"
                    >
                      <GitFork size={11} />
                      Fork
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[#2a2a2a]">
              {branches.branches.map(branch => (
                <div key={branch} className="flex items-center justify-between px-6 py-3 hover:bg-[#1f1f1f] transition-colors">
                  <div className="flex items-center gap-2">
                    <GitBranch size={14} className="text-[#555]" />
                    <span className="text-sm font-mono">{branch}</span>
                    {branch === branches.current && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-900/30 text-purple-400 border border-purple-900/40">current</span>
                    )}
                  </div>
                  {branch !== branches.current && (
                    <button
                      onClick={() => handleCheckout(branch)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#2a2a2a] text-[#888] hover:text-[#e8e8e8] hover:bg-[#333] transition-colors"
                    >
                      Checkout
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
