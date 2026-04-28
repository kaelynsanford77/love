import { useState, useEffect, useRef } from 'react'
import {
  RefreshCw, ExternalLink, Monitor, Tablet, Smartphone,
  AlertTriangle, X, ChevronDown, Layers
} from 'lucide-react'

function sanitizePreviewUrl(input: string): string {
  try {
    const parsed = new URL(input);
    // Only allow http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    const hostname = parsed.hostname;
    // Allow localhost and private network ranges
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local') ||
      // 10.0.0.0/8
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      // 172.16.0.0/12
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      // 192.168.0.0/16
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname);
    return isLocal ? input : '';
  } catch {
    return '';
  }
}

interface PreviewPanelProps {
  port: number
  projectId: string
  onPortChange?: (port: number) => void
}

const VIEWPORTS = [
  { label: 'Desktop', icon: Monitor, width: '100%', height: '100%' },
  { label: 'Tablet', icon: Tablet, width: '768px', height: '1024px' },
  { label: 'Mobile', icon: Smartphone, width: '390px', height: '844px' },
]

export default function PreviewPanel({ port, projectId, onPortChange }: PreviewPanelProps) {
  const [url, setUrl] = useState(`http://localhost:${port}`)
  const [viewport, setViewport] = useState(VIEWPORTS[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [showConsole, setShowConsole] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: string; message: string; time: string }>>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    setUrl(`http://localhost:${port}`)
    setLoading(true)
    setError(null)
    setErrors([])
  }, [port])

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data?.type?.startsWith('lovable:')) return

      switch (e.data.type) {
        case 'lovable:error':
          setErrors(prev => [...prev, e.data.message].slice(-10))
          break
        case 'lovable:console':
          setConsoleLogs(prev => [...prev, {
            type: e.data.level || 'log',
            message: e.data.message,
            time: new Date().toLocaleTimeString(),
          }].slice(-100))
          break
        case 'lovable:open-source':
          // Open file in editor
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  function refresh() {
    setLoading(true)
    setError(null)
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a] flex-shrink-0">
        <button
          onClick={refresh}
          className="p-1.5 rounded hover:bg-[#1a1a1a] text-[#666] hover:text-[#888] transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>

        <div className="flex-1 mx-2">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && iframeRef.current) {
                const safe = sanitizePreviewUrl(url);
                if (safe) iframeRef.current.src = safe;
              }
            }}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1 text-xs text-[#888] font-mono focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5">
          {VIEWPORTS.map(vp => (
            <button
              key={vp.label}
              onClick={() => setViewport(vp)}
              className={`p-1.5 rounded transition-colors ${
                viewport.label === vp.label ? 'bg-[#2a2a2a] text-[#e8e8e8]' : 'text-[#555] hover:text-[#888]'
              }`}
              title={vp.label}
            >
              <vp.icon size={13} />
            </button>
          ))}
        </div>

        <button
          onClick={() => window.open(url, '_blank')}
          className="p-1.5 rounded hover:bg-[#1a1a1a] text-[#666] hover:text-[#888] transition-colors"
          title="Open in new tab"
        >
          <ExternalLink size={14} />
        </button>
      </div>

      {/* Runtime errors banner */}
      {errors.length > 0 && (
        <div className="bg-red-900/20 border-b border-red-900/30 px-4 py-2 flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-400 font-medium">Runtime errors detected</p>
            <p className="text-xs text-red-400/70 truncate">{errors[errors.length - 1]}</p>
          </div>
          <button onClick={() => setErrors([])} className="text-red-400/50 hover:text-red-400">
            <X size={12} />
          </button>
        </div>
      )}

      {/* iframe */}
      <div className="flex-1 overflow-hidden flex items-center justify-center bg-[#111] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f0f0f] z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#555]">Starting dev server...</p>
            </div>
          </div>
        )}

        <div
          className="overflow-hidden shadow-2xl transition-all duration-300"
          style={{
            width: viewport.width,
            height: viewport.height,
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          <iframe
            ref={iframeRef}
            src={sanitizePreviewUrl(url) || undefined}
            className="w-full h-full border-0 bg-white"
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError('Failed to load preview') }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-top-navigation-by-user-activation"
            title="Preview"
          />
        </div>
      </div>

      {/* Console */}
      <div className="border-t border-[#2a2a2a] flex-shrink-0">
        <button
          onClick={() => setShowConsole(!showConsole)}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#555] hover:text-[#888] hover:bg-[#1a1a1a] transition-colors"
        >
          <ChevronDown size={12} className={`transition-transform ${showConsole ? 'rotate-180' : ''}`} />
          <span>Console</span>
          {consoleLogs.length > 0 && (
            <span className="ml-auto bg-[#2a2a2a] rounded px-1.5 py-0.5 text-[10px]">{consoleLogs.length}</span>
          )}
        </button>

        {showConsole && (
          <div className="h-40 overflow-y-auto bg-[#0a0a0a] border-t border-[#2a2a2a]">
            {consoleLogs.length === 0 ? (
              <p className="text-xs text-[#444] px-4 py-3">No console output</p>
            ) : (
              consoleLogs.map((log, i) => (
                <div key={i} className={`px-4 py-1 text-xs font-mono flex items-start gap-2 border-b border-[#111] ${
                  log.type === 'error' ? 'text-red-400 bg-red-900/10' :
                  log.type === 'warn' ? 'text-amber-400 bg-amber-900/10' :
                  'text-[#888]'
                }`}>
                  <span className="text-[#444] flex-shrink-0">{log.time}</span>
                  <span className="flex-1 whitespace-pre-wrap break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
