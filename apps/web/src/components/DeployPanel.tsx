import { useState } from 'react'
import { Rocket, X, Check, Loader2, ExternalLink, Globe } from 'lucide-react'
import { execApi } from '../lib/api'
import { toast } from 'sonner'

interface DeployPanelProps {
  projectId: string
  onClose: () => void
}

const DEPLOY_TARGETS = [
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy to Vercel with automatic git integration',
    icon: '▲',
    command: 'npx vercel --prod --yes',
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'Deploy to Netlify CDN',
    icon: '◈',
    command: 'npx netlify-cli deploy --dir=dist --prod',
  },
  {
    id: 'gh-pages',
    name: 'GitHub Pages',
    description: 'Deploy to GitHub Pages',
    icon: '⬡',
    command: 'npm run build && npx gh-pages -d dist',
  },
]

export default function DeployPanel({ projectId, onClose }: DeployPanelProps) {
  const [deploying, setDeploying] = useState<string | null>(null)
  const [deployLog, setDeployLog] = useState<string>('')
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null)

  async function deploy(target: typeof DEPLOY_TARGETS[0]) {
    setDeploying(target.id)
    setDeployLog('')
    setDeployedUrl(null)

    try {
      // First build
      setDeployLog('Building project...\n')
      const buildResult = await execApi.run(projectId, 'bun run build')
      setDeployLog(prev => prev + buildResult.stdout + buildResult.stderr + '\n')

      if (buildResult.exitCode !== 0) {
        toast.error('Build failed')
        return
      }

      setDeployLog(prev => prev + `Deploying to ${target.name}...\n`)
      const deployResult = await execApi.run(projectId, target.command)
      setDeployLog(prev => prev + deployResult.stdout + deployResult.stderr)

      if (deployResult.exitCode === 0) {
        toast.success(`Deployed to ${target.name}!`)
        // Try to extract URL from output
        const urlMatch = deployResult.stdout.match(/https?:\/\/[^\s]+/)
        if (urlMatch) setDeployedUrl(urlMatch[0])
      } else {
        toast.error('Deployment failed')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeploying(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <Rocket size={18} className="text-[#888]" />
            <h2 className="text-base font-semibold">Deploy</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#e8e8e8]">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {DEPLOY_TARGETS.map(target => (
            <div
              key={target.id}
              className="flex items-center justify-between p-4 bg-[#111] border border-[#2a2a2a] rounded-xl hover:border-[#3a3a3a] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{target.icon}</span>
                <div>
                  <p className="text-sm font-medium text-[#e8e8e8]">{target.name}</p>
                  <p className="text-xs text-[#555]">{target.description}</p>
                </div>
              </div>
              <button
                onClick={() => deploy(target)}
                disabled={!!deploying}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-all"
                style={{ background: 'oklch(0.55 0.18 265)' }}
              >
                {deploying === target.id ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />}
                Deploy
              </button>
            </div>
          ))}
        </div>

        {/* Deploy log */}
        {deployLog && (
          <div className="mx-6 mb-6">
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 max-h-48 overflow-y-auto">
              <pre className="text-xs text-[#888] font-mono whitespace-pre-wrap">{deployLog}</pre>
            </div>
            {deployedUrl && (
              <a
                href={deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-green-900/20 border border-green-900/30 rounded-xl text-green-400 hover:bg-green-900/30 transition-colors"
              >
                <Globe size={14} />
                <span className="text-sm font-medium">{deployedUrl}</span>
                <ExternalLink size={12} className="ml-auto" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
