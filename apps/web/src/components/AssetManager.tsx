import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Copy, Trash2, Image, File, Loader2 } from 'lucide-react'
import { fsApi } from '../lib/api'
import { formatBytes } from '../lib/utils'
import { toast } from 'sonner'
import type { FileNode } from '../types'

interface AssetManagerProps {
  projectId: string
  onClose: () => void
}

export default function AssetManager({ projectId, onClose }: AssetManagerProps) {
  const [assets, setAssets] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadAssets()
  }, [projectId])

  async function loadAssets() {
    setLoading(true)
    try {
      const { tree } = await fsApi.tree(projectId, 'public')
      const files = flattenFiles(tree)
      setAssets(files)
    } catch {
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  function flattenFiles(nodes: FileNode[]): FileNode[] {
    const result: FileNode[] = []
    for (const node of nodes) {
      if (node.type === 'file') result.push(node)
      if (node.children) result.push(...flattenFiles(node.children))
    }
    return result
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      setUploading(true)
      try {
        await fsApi.upload(projectId, acceptedFiles, 'public')
        toast.success(`Uploaded ${acceptedFiles.length} file(s)`)
        loadAssets()
      } catch (err: any) {
        toast.error(err.message)
      } finally {
        setUploading(false)
      }
    },
  })

  async function deleteAsset(path: string) {
    try {
      await fsApi.delete(projectId, path)
      setAssets(prev => prev.filter(a => a.path !== path))
      toast.success('Asset deleted')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  function copyPath(path: string) {
    navigator.clipboard.writeText(`/${path}`)
    toast.success('Path copied')
  }

  const isImage = (node: FileNode) =>
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'].includes(node.ext || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-base font-semibold">Asset Manager</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#e8e8e8]">✕</button>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`mx-6 mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-purple-500/70 bg-purple-500/5' : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 size={20} className="animate-spin mx-auto text-[#555]" />
          ) : (
            <>
              <Upload size={20} className="mx-auto text-[#555] mb-2" />
              <p className="text-sm text-[#555]">
                {isDragActive ? 'Drop files here' : 'Drag & drop files, or click to select'}
              </p>
            </>
          )}
        </div>

        {/* Assets grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#555]" size={24} />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 text-[#555]">
              <Image size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No assets in public/</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {assets.map(asset => (
                <div key={asset.path} className="group relative bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#3a3a3a] transition-colors">
                  <div className="aspect-square flex items-center justify-center">
                    {isImage(asset) ? (
                      <img
                        src={`/api/projects/${projectId}/public/${asset.name}`}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <File size={32} className="text-[#444]" />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-[#888] truncate font-mono">{asset.name}</p>
                    {asset.size && (
                      <p className="text-[10px] text-[#555]">{formatBytes(asset.size)}</p>
                    )}
                  </div>
                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => copyPath(asset.path)}
                      className="p-2 rounded-lg bg-[#1a1a1a] text-[#888] hover:text-[#e8e8e8] transition-colors"
                      title="Copy path"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => deleteAsset(asset.path)}
                      className="p-2 rounded-lg bg-red-900/40 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
