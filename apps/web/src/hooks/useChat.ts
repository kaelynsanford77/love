import { useState, useCallback, useRef } from 'react'
import { streamChat, chatApi } from '../lib/api'
import type { ChatTurn } from '../types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string
  tokensIn?: number
  tokensOut?: number
  costUsd?: number
  gitSha?: string
  attachments?: any[]
  streaming?: boolean
  toolCalls?: ToolCallEntry[]
  qaStatus?: { passed: boolean; output: string }
  error?: string
  turn_index: number
  created_at: string
}

export interface ToolCallEntry {
  id: string
  name: string
  args: any
  result?: { success: boolean; output: string }
  status: 'pending' | 'done' | 'error'
}

export function useChat(projectId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentModel, setCurrentModel] = useState<string>('')
  const abortRef = useRef<AbortController | null>(null)

  const loadHistory = useCallback(async () => {
    if (!projectId) return
    try {
      const turns = await chatApi.history(projectId)
      setMessages(turns.map((t, i) => ({
        id: t.id,
        role: t.role,
        content: t.content,
        model: t.model,
        tokensIn: t.tokens_in,
        tokensOut: t.tokens_out,
        costUsd: t.cost_usd,
        gitSha: t.git_sha,
        attachments: t.attachments ? JSON.parse(t.attachments) : [],
        turn_index: t.turn_index ?? i,
        created_at: t.created_at,
      })))
    } catch {}
  }, [projectId])

  const sendMessage = useCallback(async (message: string, attachments: any[] = []) => {
    if (!projectId || isStreaming) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      attachments,
      turn_index: messages.length,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])

    const assistantMsgId = `assistant-${Date.now()}`
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      streaming: true,
      toolCalls: [],
      turn_index: messages.length + 1,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, assistantMsg])
    setIsStreaming(true)

    abortRef.current = new AbortController()

    try {
      await streamChat(
        projectId,
        message,
        attachments,
        (event, data) => {
          switch (event) {
            case 'model':
              setCurrentModel(data.model)
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId ? { ...m, model: data.model } : m
              ))
              break
            case 'text':
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + data.delta }
                  : m
              ))
              break
            case 'tool_call':
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      toolCalls: [...(m.toolCalls || []), {
                        id: data.id,
                        name: data.name,
                        args: data.args,
                        status: 'pending',
                      }],
                    }
                  : m
              ))
              break
            case 'tool_result':
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      toolCalls: (m.toolCalls || []).map(tc =>
                        tc.id === data.id
                          ? { ...tc, result: { success: data.success, output: data.output }, status: data.success ? 'done' : 'error' }
                          : tc
                      ),
                    }
                  : m
              ))
              break
            case 'qa':
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, qaStatus: { passed: data.passed, output: data.output } }
                  : m
              ))
              break
            case 'done':
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      streaming: false,
                      model: data.model,
                      tokensIn: data.tokensIn,
                      tokensOut: data.tokensOut,
                      costUsd: data.costUsd,
                      id: data.turnId || m.id,
                    }
                  : m
              ))
              break
            case 'error':
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, streaming: false, error: data.message }
                  : m
              ))
              break
          }
        },
        abortRef.current.signal
      )
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, streaming: false, error: err.message }
            : m
        ))
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [projectId, isStreaming, messages.length])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false } : m))
  }, [])

  const clearHistory = useCallback(async () => {
    if (!projectId) return
    await chatApi.clearHistory(projectId)
    setMessages([])
  }, [projectId])

  return {
    messages,
    isStreaming,
    currentModel,
    sendMessage,
    stopStreaming,
    loadHistory,
    clearHistory,
  }
}
