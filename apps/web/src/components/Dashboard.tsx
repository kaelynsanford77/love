import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Plus, Search, Github, Clock, Trash2, ExternalLink, X, Loader2 } from 'lucide-react'
import { projectsApi, githubApi } from '../lib/api'
import { formatDate } from '../lib/utils'
import { toast } from 'sonner'
import type { Project } from '../types'

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const data = await projectsApi.list()
      setProjects(data)
    } catch (err: any) {
      toast.error('Failed to load projects: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteProject(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this project? This cannot be undone.')) return
    try {
      await projectsApi.delete(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success('Project deleted')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8e8e8]">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="text-purple-400 fill-purple-400" size={24} />
          <span className="text-xl font-semibold">Love</span>
          <span className="text-xs text-[#555] ml-1">AI-Powered IDE</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a2a2a] text-sm hover:border-[#444] hover:bg-[#1a1a1a] transition-all text-[#888]"
          >
            <Github size={16} />
            Import from GitHub
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all text-white"
            style={{ background: 'oklch(0.55 0.18 265)' }}
          >
            <Plus size={16} />
            New project
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={16} />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-[#e8e8e8] placeholder-[#555] text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-[#555]" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Heart className="mx-auto text-[#333] fill-[#333] mb-4" size={48} />
            <h3 className="text-xl font-medium text-[#555] mb-2">
              {search ? 'No projects match your search' : 'No projects yet'}
            </h3>
            <p className="text-[#444] mb-6 text-sm">
              {search ? 'Try a different search term' : 'Create your first project to get started'}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Create project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => navigate(`/project/${project.id}`)}
                onDelete={(e) => deleteProject(project.id, e)}
              />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={(project) => {
            setProjects(prev => [project, ...prev])
            setShowCreate(false)
            navigate(`/project/${project.id}`)
          }}
        />
      )}

      {showImport && (
        <ImportGithubModal
          onClose={() => setShowImport(false)}
          onImport={(project) => {
            setProjects(prev => [project, ...prev])
            setShowImport(false)
            navigate(`/project/${project.id}`)
          }}
        />
      )}
    </div>
  )
}

function ProjectCard({ project, onOpen, onDelete }: {
  project: Project
  onOpen: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <div
      onClick={onOpen}
      className="group relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 cursor-pointer hover:border-[#3a3a3a] hover:bg-[#1f1f1f] transition-all duration-150"
    >
      {/* Preview thumbnail placeholder */}
      <div className="w-full h-32 rounded-lg bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] mb-4 flex items-center justify-center overflow-hidden">
        <div className="text-4xl opacity-20">⚛️</div>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[#e8e8e8] truncate">{project.name}</h3>
          {project.description && (
            <p className="text-xs text-[#666] mt-0.5 line-clamp-2">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onOpen() }}
            className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#666] hover:text-[#e8e8e8]"
            title="Open"
          >
            <ExternalLink size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-900/30 text-[#666] hover:text-red-400"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 text-xs text-[#555]">
        <Clock size={11} />
        <span>{formatDate(project.updated_at)}</span>
        {project.github_repo && (
          <>
            <span className="mx-1">·</span>
            <Github size={11} />
          </>
        )}
      </div>
    </div>
  )
}

function CreateProjectModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (p: Project) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const project = await projectsApi.create({ name: name.trim(), description: description.trim() })
      onCreate(project)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="New Project" onClose={onClose}>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm text-[#888] mb-1.5">Project name</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="My awesome app"
            className="input-base"
          />
        </div>
        <div>
          <label className="block text-sm text-[#888] mb-1.5">Description <span className="text-[#555]">(optional)</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What are you building?"
            rows={3}
            className="input-base resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Create project
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ImportGithubModal({ onClose, onImport }: {
  onClose: () => void
  onImport: (p: Project) => void
}) {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!repoUrl.trim()) return
    setLoading(true)
    try {
      const project = await githubApi.import(repoUrl.trim())
      onImport(project)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Import from GitHub" onClose={onClose}>
      <form onSubmit={handleImport} className="space-y-4">
        <div>
          <label className="block text-sm text-[#888] mb-1.5">Repository URL</label>
          <input
            autoFocus
            type="url"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            placeholder="https://github.com/user/repo"
            className="input-base"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            type="submit"
            disabled={!repoUrl.trim() || loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Import
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Modal({ title, onClose, children }: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#666] hover:text-[#e8e8e8] transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
