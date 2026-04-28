import { useState, useCallback, useRef } from 'react';

export type Tier = 'fast' | 'standard' | 'powerful';

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tier?: Tier;
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  duration_ms?: number;
  escalated_from?: Tier;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL ?? 'http://localhost:3001';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionId = useRef<string | undefined>(undefined);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(`${ORCHESTRATOR_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId.current,
          messages: apiMessages,
        }),
      });

      const data = await resp.json();
      sessionId.current = data.session_id;

      const assistantMsg: ChatMessage = {
        id: data.turn_id ?? crypto.randomUUID(),
        role: 'assistant',
        content: data.content ?? data.error ?? 'No response',
        tier: data.tier,
        model: data.model,
        tokens_in: data.tokens_in,
        tokens_out: data.tokens_out,
        cost_usd: data.cost_usd,
        duration_ms: data.duration_ms,
        escalated_from: data.escalated_from,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Failed to connect to orchestrator. Is it running?',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return { messages, isLoading, sendMessage };
}
