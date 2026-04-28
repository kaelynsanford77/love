import { useState, useRef, useEffect } from 'react'
import {
  Send, Square, Trash2, Paperclip, Image, Link,
  ChevronDown, ChevronRight, Code2, Check, X,
  Loader2, AlertCircle, Wrench
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDate } from '../lib/utils'
import type { ChatMessage } from '../hooks/useChat'

interface ChatPanelProps {
  projectId: string
  messages: ChatMessage[]
  isStreaming: boolean
  onSendMessage: (message: string, attachments?: any[]) => void
  onStopStreaming: () => void
  onClearHistory: () => void
  onOpenFile: (path: string) => void
}

const MODEL_COLORS: Record<string, { label: string; color: string }> = {
  'gpt-4o-mini': { label: 'fast', color: '#22c55e' },
  'gpt-4o': { label: 'standard', color: '#3b82f6' },
  'claude-haiku-3-5': { label: 'haiku', color: '#22c55e' },
  'claude-sonnet-4-5': { label: 'sonnet', color: '#3b82f6' },
  'claude-opus-4-5': { label: 'opus', color: '#a855f7' },
}

export default function ChatPanel({
  projectId,
  messages,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  onClearHistory,
  onOpenFile,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim() || isStreaming) return
    onSendMessage(input.trim(), attachments)
    setInput('')
    setAttachments([])
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(i => i.type.startsWith('image/'))
    if (imageItem) {
      const file = imageItem.getAsFile()
      if (file) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          setAttachments(prev => [...prev, {
            type: 'image',
            name: 'pasted-image.png',
            data: ev.target?.result,
          }])
        }
        reader.readAsDataURL(file)
      }
    }
  }

  function addFileAttachment() {
    fileInputRef.current?.click()
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setAttachments(prev => [...prev, {
          type: file.type.startsWith('image/') ? 'image' : 'file',
          name: file.name,
          data: ev.target?.result,
        }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] flex-shrink-0">
        <span className="text-sm font-medium text-[#888]">Chat</span>
        <button
          onClick={onClearHistory}
          title="Clear history"
          className="p-1.5 rounded hover:bg-[#2a2a2a] text-[#555] hover:text-[#888] transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm text-[#555]">Ask me anything about your project</p>
            <div className="mt-4 space-y-2 w-full">
              {[
                'Add a navigation bar',
                'Create a contact form',
                'Add dark mode support',
                'Fix TypeScript errors',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); textareaRef.current?.focus() }}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] hover:text-[#888] hover:border-[#3a3a3a] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <MessageItem key={msg.id} message={msg} onOpenFile={onOpenFile} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-[#2a2a2a]">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-[#2a2a2a] rounded-lg text-xs text-[#888]">
              {att.type === 'image' ? <Image size={12} /> : <Paperclip size={12} />}
              <span className="max-w-[100px] truncate">{att.name}</span>
              <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="hover:text-red-400">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 p-4 border-t border-[#2a2a2a]">
        <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden focus-within:border-purple-500/50">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Ask me to build something..."
            rows={3}
            disabled={isStreaming}
            className="w-full bg-transparent px-4 pt-3 pb-2 text-sm text-[#e8e8e8] placeholder-[#444] resize-none outline-none disabled:opacity-60"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={addFileAttachment}
                title="Attach file"
                className="p-1.5 rounded-lg text-[#555] hover:text-[#888] hover:bg-[#2a2a2a] transition-colors"
              >
                <Paperclip size={14} />
              </button>
              <button
                onClick={() => {
                  const url = prompt('Enter URL:')
                  if (url) setAttachments(prev => [...prev, { type: 'url', name: url, data: url }])
                }}
                title="Attach URL"
                className="p-1.5 rounded-lg text-[#555] hover:text-[#888] hover:bg-[#2a2a2a] transition-colors"
              >
                <Link size={14} />
              </button>
            </div>

            {isStreaming ? (
              <button
                onClick={onStopStreaming}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 transition-all"
              >
                <Square size={12} />
                Stop
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40 transition-all"
                style={{ background: 'oklch(0.55 0.18 265)' }}
              >
                <Send size={12} />
                Send
              </button>
            )}
          </div>
        </div>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
      </div>
    </div>
  )
}

function MessageItem({ message, onOpenFile }: { message: ChatMessage; onOpenFile: (p: string) => void }) {
  const [collapsed, setCollapsed] = useState(true)
  const modelInfo = message.model ? MODEL_COLORS[message.model] : null

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-[#2a2a2a] rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm text-[#e8e8e8] whitespace-pre-wrap">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {message.attachments.map((att: any, i: number) => (
                <div key={i} className="flex items-center gap-1 text-xs text-[#666]">
                  {att.type === 'image' ? <Image size={11} /> : <Paperclip size={11} />}
                  <span>{att.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Model badge */}
      {modelInfo && (
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: modelInfo.color }}
          />
          <span className="text-xs text-[#555]">{modelInfo.label}</span>
          {message.costUsd && message.costUsd > 0 && (
            <span className="text-xs text-[#444]">
              ${message.costUsd.toFixed(4)}
            </span>
          )}
        </div>
      )}

      {/* Tool calls */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="space-y-1.5">
          {message.toolCalls.map(tc => (
            <ToolCallCard key={tc.id} toolCall={tc} onOpenFile={onOpenFile} />
          ))}
        </div>
      )}

      {/* Content */}
      {message.content && (
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children }) {
                const isBlock = className?.includes('language-')
                return isBlock ? (
                  <pre className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3 overflow-x-auto">
                    <code className="text-xs font-mono text-[#e8e8e8]">{children}</code>
                  </pre>
                ) : (
                  <code className="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-xs font-mono text-purple-300">{children}</code>
                )
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
          {message.streaming && <span className="streaming-cursor" />}
        </div>
      )}

      {message.streaming && !message.content && (
        <div className="flex items-center gap-2 text-[#555]">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-xs">Thinking...</span>
        </div>
      )}

      {/* QA status */}
      {message.qaStatus && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
          message.qaStatus.passed
            ? 'bg-green-900/20 text-green-400 border border-green-900/30'
            : 'bg-red-900/20 text-red-400 border border-red-900/30'
        }`}>
          {message.qaStatus.passed ? <Check size={12} /> : <AlertCircle size={12} />}
          <span>TypeScript {message.qaStatus.passed ? 'OK' : 'errors found'}</span>
        </div>
      )}

      {/* Error */}
      {message.error && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-red-900/20 text-red-400 border border-red-900/30">
          <AlertCircle size={12} />
          <span>{message.error}</span>
        </div>
      )}

      {/* Metadata */}
      {!message.streaming && message.created_at && (
        <div className="text-xs text-[#444]">{formatDate(message.created_at)}</div>
      )}
    </div>
  )
}

function ToolCallCard({ toolCall, onOpenFile }: {
  toolCall: { id: string; name: string; args: any; result?: { success: boolean; output: string }; status: string }
  onOpenFile: (p: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const iconMap: Record<string, string> = {
    read_file: '📖', write_file: '✏️', create_file: '📄',
    delete_file: '🗑️', run_command: '⚡', list_files: '📁', fetch_url: '🌐',
  }

  const isFileOp = ['read_file', 'write_file', 'create_file'].includes(toolCall.name)

  return (
    <div className={`rounded-lg border text-xs overflow-hidden ${
      toolCall.status === 'pending'
        ? 'border-[#2a2a2a] bg-[#1a1a1a]'
        : toolCall.status === 'error' || toolCall.result?.success === false
          ? 'border-red-900/40 bg-red-900/10'
          : 'border-[#2a2a2a] bg-[#1a1a1a]'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <span>{iconMap[toolCall.name] || '🔧'}</span>
        <span className="font-mono text-[#888]">{toolCall.name}</span>
        {toolCall.args?.path && (
          <span className="text-[#555] truncate flex-1">{toolCall.args.path}</span>
        )}
        {toolCall.args?.command && (
          <span className="text-[#555] truncate flex-1 font-mono">{toolCall.args.command}</span>
        )}
        {toolCall.status === 'pending' ? (
          <Loader2 size={11} className="animate-spin text-[#555] ml-auto flex-shrink-0" />
        ) : toolCall.result?.success === false ? (
          <X size={11} className="text-red-400 ml-auto flex-shrink-0" />
        ) : (
          <Check size={11} className="text-green-400 ml-auto flex-shrink-0" />
        )}
        {expanded ? <ChevronDown size={11} className="flex-shrink-0" /> : <ChevronRight size={11} className="flex-shrink-0" />}
      </button>

      {expanded && toolCall.result && (
        <div className="border-t border-[#2a2a2a] px-3 py-2">
          <pre className="text-[#666] font-mono text-[10px] max-h-32 overflow-y-auto whitespace-pre-wrap">
            {toolCall.result.output || '(no output)'}
          </pre>
          {isFileOp && toolCall.args?.path && (
            <button
              onClick={() => onOpenFile(toolCall.args.path)}
              className="mt-1.5 text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <Code2 size={10} />
              Open file
            </button>
          )}
        </div>
      )}
    </div>
  )
}
