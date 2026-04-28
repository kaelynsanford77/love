import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { Send, Square, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@/hooks/useChat';
import type { Tier, ChatMessage } from '@/hooks/useChat';
import ReactMarkdown from 'react-markdown';

const TIER_CONFIG: Record<Tier, { dot: string; label: string; pill: string }> = {
  fast: { dot: 'bg-green-500', label: 'haiku', pill: 'pill-fast' },
  standard: { dot: 'bg-blue-500', label: 'sonnet', pill: 'pill-standard' },
  powerful: { dot: 'bg-purple-500', label: 'opus', pill: 'pill-powerful' },
};

function ModelPill({ tier, escalated_from, model, tokens_in, tokens_out, cost_usd, duration_ms }: {
  tier: Tier;
  escalated_from?: Tier;
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  duration_ms?: number;
}) {
  const cfg = TIER_CONFIG[tier];
  const tooltip = [
    model && `Model: ${model}`,
    tokens_in && `Tokens in: ${tokens_in}`,
    tokens_out && `Tokens out: ${tokens_out}`,
    cost_usd !== undefined && `Cost: $${cost_usd.toFixed(5)}`,
    duration_ms && `Duration: ${duration_ms}ms`,
  ].filter(Boolean).join('\n');

  return (
    <div className="flex items-center gap-1 mt-1">
      <span
        title={tooltip}
        className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-default', cfg.pill)}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
        {cfg.label}
      </span>
      {escalated_from && (
        <span className="text-[10px] text-muted-foreground">
          ⬆️ Escalated from {TIER_CONFIG[escalated_from].label} → {cfg.label} (QA failed)
        </span>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[85%] px-3 py-2 rounded-xl bg-primary/15 border border-primary/20 text-foreground text-[15px]">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="prose prose-invert prose-sm max-w-none text-[15px] text-foreground">
        <ReactMarkdown>{msg.content}</ReactMarkdown>
      </div>
      {msg.tier && (
        <ModelPill
          tier={msg.tier}
          escalated_from={msg.escalated_from}
          model={msg.model}
          tokens_in={msg.tokens_in}
          tokens_out={msg.tokens_out}
          cost_usd={msg.cost_usd}
          duration_ms={msg.duration_ms}
        />
      )}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 mb-4 text-muted-foreground text-sm">
      <span>Thinking</span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-current animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </div>
  );
}

const SUGGESTIONS = [
  'Build a todo app with React',
  'Create a landing page with hero section',
  'Add authentication with email/password',
  'Design a dashboard with charts',
];

export default function ChatPanel() {
  const { messages, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
            <div className="text-2xl font-bold text-foreground">What would you like to build?</div>
            <p className="text-muted-foreground text-sm max-w-xs">
              Describe your idea and I'll build it for you.
            </p>
            <div className="flex flex-col gap-2 w-full mt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                  className="text-left px-3 py-2 rounded-lg bg-muted hover:bg-accent/20 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && <ThinkingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3 bg-card">
        <div className="flex flex-col gap-2 bg-muted/50 rounded-xl border border-border p-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask anything... (⌘↵ to send)"
            rows={1}
            className="w-full bg-transparent text-foreground text-[15px] resize-none focus:outline-none placeholder:text-muted-foreground leading-relaxed min-h-[24px]"
          />
          <div className="flex items-center justify-between">
            <button
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
              title="Attach file"
            >
              <Paperclip size={13} />
              Attach
            </button>
            <button
              onClick={isLoading ? undefined : handleSend}
              disabled={!input.trim() && !isLoading}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-[0.97]',
                isLoading
                  ? 'bg-destructive/20 text-destructive border border-destructive/30'
                  : input.trim()
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              {isLoading ? (
                <><Square size={12} /> Stop</>
              ) : (
                <><Send size={12} /> Send</>
              )}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          ⌘↵ to send · Drag files to attach
        </p>
      </div>
    </div>
  );
}
