import { useState, useEffect } from 'react'
import { Search, Package, Download, Trash2, RefreshCw, Loader2, ExternalLink } from 'lucide-react'
import { npmApi, execApi } from '../lib/api'
import { toast } from 'sonner'
import type { NpmPackage } from '../types'

interface PackageManagerProps {
  projectId: string
  onClose: () => void
}

export default function PackageManager({ projectId, onClose }: PackageManagerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NpmPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [installing, setInstalling] = useState<string | null>(null)

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const { packages } = await npmApi.search(query)
      setResults(packages)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function install(packageName: string, version: string) {
    setInstalling(packageName)
    try {
      const { stdout, stderr, exitCode } = await execApi.run(projectId, `bun add ${packageName}@${version}`)
      if (exitCode === 0) {
        toast.success(`Installed ${packageName}@${version}`)
      } else {
        toast.error(`Install failed: ${stderr}`)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setInstalling(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-[#888]" />
            <h2 className="text-base font-semibold">Package Manager</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#e8e8e8]">✕</button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-[#2a2a2a]">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="Search npm packages..."
                className="input-base pl-9"
              />
            </div>
            <button
              onClick={search}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1f1f1f]">
          {results.map(pkg => (
            <div key={pkg.name} className="flex items-start gap-4 px-6 py-4 hover:bg-[#1f1f1f] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[#e8e8e8]">{pkg.name}</span>
                  <span className="text-xs text-[#555] font-mono">{pkg.version}</span>
                </div>
                {pkg.description && (
                  <p className="text-xs text-[#666] mt-1 line-clamp-2">{pkg.description}</p>
                )}
                {pkg.keywords && pkg.keywords.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {pkg.keywords.slice(0, 4).map(kw => (
                      <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2a2a] text-[#555]">{kw}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`https://www.npmjs.com/package/${pkg.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#888]"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  onClick={() => install(pkg.name, pkg.version)}
                  disabled={installing === pkg.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white disabled:opacity-60"
                  style={{ background: 'oklch(0.55 0.18 265)' }}
                >
                  {installing === pkg.name ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                  Install
                </button>
              </div>
            </div>
          ))}

          {results.length === 0 && !loading && (
            <div className="text-center py-16 text-[#555]">
              <Package size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Search for packages to install</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
