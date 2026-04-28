import { useEffect, useRef, useState } from 'react'
import { X, Plus, Terminal as TerminalIcon } from 'lucide-react'

interface TerminalProps {
  projectId: string
  onClose: () => void
}

interface TerminalTab {
  id: string
  sessionId: string
  title: string
}

export default function Terminal({ projectId, onClose }: TerminalProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalsRef = useRef<Map<string, any>>(new Map())
  const websocketsRef = useRef<Map<string, WebSocket>>(new Map())

  useEffect(() => {
    createTab()
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup all websockets
      websocketsRef.current.forEach(ws => ws.close())
    }
  }, [])

  function createTab() {
    const id = `tab-${Date.now()}`
    const sessionId = `session-${Date.now()}`
    const tab: TerminalTab = { id, sessionId, title: 'Terminal' }
    setTabs(prev => [...prev, tab])
    setActiveTab(id)

    // Initialize terminal after state update
    setTimeout(() => initTerminal(id, sessionId), 100)
  }

  async function initTerminal(tabId: string, sessionId: string) {
    const container = document.getElementById(`terminal-${tabId}`)
    if (!container) return

    try {
      const { Terminal } = await import('xterm')
      const { FitAddon } = await import('xterm-addon-fit')
      const { WebLinksAddon } = await import('xterm-addon-web-links')

      const xterm = new Terminal({
        theme: {
          background: '#0a0a0a',
          foreground: '#e8e8e8',
          cursor: 'oklch(0.55 0.18 265)',
          selectionBackground: 'oklch(0.55 0.18 265 / 0.3)',
          black: '#000000',
          red: '#ff6b6b',
          green: '#6bcb77',
          yellow: '#ffd166',
          blue: '#6b9fff',
          magenta: '#c77dff',
          cyan: '#4cc9f0',
          white: '#e8e8e8',
        },
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        fontSize: 13,
        lineHeight: 1.5,
        cursorBlink: true,
        scrollback: 5000,
      })

      const fitAddon = new FitAddon()
      xterm.loadAddon(fitAddon)
      xterm.loadAddon(new WebLinksAddon())
      xterm.open(container)
      fitAddon.fit()
      terminalsRef.current.set(tabId, { xterm, fitAddon })

      // Connect WebSocket
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:3001/api/terminal?projectId=${encodeURIComponent(projectId)}&sessionId=${encodeURIComponent(sessionId)}`
      const ws = new WebSocket(wsUrl)
      websocketsRef.current.set(tabId, ws)

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'output') {
            xterm.write(msg.data)
          } else if (msg.type === 'exit') {
            xterm.write('\r\n\x1b[31m[Process exited]\x1b[0m\r\n')
          }
        } catch {
          xterm.write(event.data)
        }
      }

      ws.onclose = () => {
        xterm.write('\r\n\x1b[33m[Connection closed]\x1b[0m\r\n')
      }

      xterm.onData(data => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data }))
        }
      })

      xterm.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', cols, rows }))
        }
      })

      // Handle resize
      const resizeObserver = new ResizeObserver(() => fitAddon.fit())
      resizeObserver.observe(container)

    } catch (err) {
      console.error('Failed to initialize terminal:', err)
      container.innerHTML = '<p class="text-red-400 p-4 text-sm">Failed to initialize terminal. Make sure xterm is installed.</p>'
    }
  }

  function closeTab(tabId: string) {
    const ws = websocketsRef.current.get(tabId)
    if (ws) { ws.close(); websocketsRef.current.delete(tabId) }

    const terminal = terminalsRef.current.get(tabId)
    if (terminal) { terminal.xterm.dispose(); terminalsRef.current.delete(tabId) }

    setTabs(prev => {
      const next = prev.filter(t => t.id !== tabId)
      if (activeTab === tabId && next.length > 0) setActiveTab(next[next.length - 1].id)
      else if (next.length === 0) onClose()
      return next
    })
  }

  return (
    <div className="h-64 border-t border-[#2a2a2a] flex flex-col bg-[#0a0a0a] flex-shrink-0">
      {/* Tab bar */}
      <div className="flex items-center border-b border-[#2a2a2a] flex-shrink-0">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs cursor-pointer border-r border-[#2a2a2a] transition-colors ${
              activeTab === tab.id ? 'bg-[#1a1a1a] text-[#e8e8e8]' : 'text-[#555] hover:text-[#888]'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <TerminalIcon size={11} />
            <span>{tab.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
              className="p-0.5 rounded hover:bg-[#2a2a2a] text-[#444] hover:text-[#888]"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        <button
          onClick={createTab}
          className="px-3 py-1.5 text-[#555] hover:text-[#888] hover:bg-[#1a1a1a] transition-colors"
          title="New terminal"
        >
          <Plus size={13} />
        </button>
        <div className="ml-auto">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[#555] hover:text-[#888] hover:bg-[#1a1a1a] transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Terminal containers */}
      <div className="flex-1 overflow-hidden relative">
        {tabs.map(tab => (
          <div
            key={tab.id}
            id={`terminal-${tab.id}`}
            className={`absolute inset-0 ${activeTab === tab.id ? 'block' : 'hidden'}`}
          />
        ))}
      </div>
    </div>
  )
}
