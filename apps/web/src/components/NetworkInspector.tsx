import { useState } from 'react'
import { Globe, Network, BarChart2, AlertCircle, X, RefreshCw } from 'lucide-react'

interface NetworkInspectorProps {
  onClose: () => void
}

interface NetworkRequest {
  id: string
  method: string
  url: string
  status: number
  type: string
  size: string
  duration: number
  time: string
}

interface ConsoleEntry {
  type: 'log' | 'warn' | 'error' | 'info'
  message: string
  time: string
}

export default function NetworkInspector({ onClose }: NetworkInspectorProps) {
  const [activeTab, setActiveTab] = useState<'console' | 'network' | 'performance' | 'accessibility'>('console')
  const [requests] = useState<NetworkRequest[]>([])
  const [consoleLogs] = useState<ConsoleEntry[]>([])

  const tabs = [
    { id: 'console', label: 'Console', icon: Globe },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'performance', label: 'Performance', icon: BarChart2 },
    { id: 'accessibility', label: 'Accessibility', icon: AlertCircle },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border-t border-[#2a2a2a] w-full max-h-[50vh] flex flex-col shadow-2xl">
        {/* Tab bar */}
        <div className="flex items-center border-b border-[#2a2a2a] flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-[#e8e8e8]'
                  : 'border-transparent text-[#555] hover:text-[#888]'
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 pr-2">
            <button className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#888]">
              <RefreshCw size={12} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#888]">
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'console' && (
            <div className="p-2">
              {consoleLogs.length === 0 ? (
                <p className="text-xs text-[#444] px-3 py-4 text-center">No console output. Messages from the preview iframe will appear here.</p>
              ) : (
                consoleLogs.map((entry, i) => (
                  <div key={i} className={`px-4 py-1.5 text-xs font-mono flex items-start gap-3 border-b border-[#111] ${
                    entry.type === 'error' ? 'text-red-400' :
                    entry.type === 'warn' ? 'text-amber-400' :
                    entry.type === 'info' ? 'text-blue-400' :
                    'text-[#888]'
                  }`}>
                    <span className="text-[#444] flex-shrink-0">{entry.time}</span>
                    <span className="whitespace-pre-wrap break-all">{entry.message}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'network' && (
            <div>
              {requests.length === 0 ? (
                <p className="text-xs text-[#444] px-3 py-4 text-center">No network requests recorded.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-[#111] sticky top-0">
                    <tr>
                      {['Method', 'URL', 'Status', 'Type', 'Size', 'Time'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-[#555] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req.id} className="border-b border-[#111] hover:bg-[#111]">
                        <td className="px-4 py-2 font-mono text-purple-400">{req.method}</td>
                        <td className="px-4 py-2 text-[#888] truncate max-w-xs">{req.url}</td>
                        <td className={`px-4 py-2 font-mono ${req.status >= 400 ? 'text-red-400' : req.status >= 300 ? 'text-amber-400' : 'text-green-400'}`}>
                          {req.status}
                        </td>
                        <td className="px-4 py-2 text-[#555]">{req.type}</td>
                        <td className="px-4 py-2 text-[#555]">{req.size}</td>
                        <td className="px-4 py-2 text-[#555]">{req.duration}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="p-6 text-center text-[#444]">
              <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Performance metrics will appear here when the preview loads</p>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="p-6 text-center text-[#444]">
              <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Accessibility audit results will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
