import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  StopCircle,
  Trash2,
  User,
  Bot,
  Wrench,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function nanoidLocal() {
  return Math.random().toString(36).slice(2, 10);
}

interface ToolCallCardProps {
  name: string;
  input?: Record<string, unknown>;
  result?: string;
}

function ToolCallCard({ name, input, result }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="tool-call-card my-1">
      <button
        className="flex items-center gap-1.5 w-full text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="font-semibold text-primary">{name}</span>
        <span className="ml-auto text-muted-foreground">
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1">
          {input && (
            <pre className="rounded bg-background/60 p-2 text-xs overflow-auto max-h-40">
              {JSON.stringify(input, null, 2)}
            </pre>
          )}
          {result && (
            <div className="mt-1">
              <span className="text-muted-foreground text-xs">Result:</span>
              <pre className="rounded bg-green-900/20 border border-green-800/30 p-2 text-xs overflow-auto max-h-40 text-green-300">
                {result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      <span className="typing-dot" style={{ animationDelay: '0ms' }} />
      <span className="typing-dot" style={{ animationDelay: '160ms' }} />
      <span className="typing-dot" style={{ animationDelay: '320ms' }} />
    </div>
  );
}

export function ChatPanel() {
  const { projectId, messages, addMessage, updateLastMessage, clearMessages, isStreaming, setIsStreaming } =
    useStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => scrollToBottom(), [messages, scrollToBottom]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg = {
      id: nanoidLocal(),
      role: 'user' as const,
      content: text,
      timestamp: Date.now(),
    };
    addMessage(userMsg);

    const assistantMsg = {
      id: nanoidLocal(),
      role: 'assistant' as const,
      content: '',
      timestamp: Date.now(),
      streaming: true,
    };
    addMessage(assistantMsg);
    setIsStreaming(true);

    let buffer = '';

    const stop = api.stream(
      '/chat/stream',
      {
        projectId,
        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
      },
      (chunk) => {
        try {
          const data = JSON.parse(chunk);
          if (data.type === 'text') {
            buffer += data.text;
            updateLastMessage({ content: buffer });
          } else if (data.type === 'tool_call') {
            addMessage({
              id: nanoidLocal(),
              role: 'tool',
              content: '',
              toolName: data.name,
              toolInput: data.input,
              toolResult: data.result,
              timestamp: Date.now(),
            });
          }
        } catch {
          buffer += chunk;
          updateLastMessage({ content: buffer });
        }
      },
      () => {
        updateLastMessage({ streaming: false });
        setIsStreaming(false);
      },
      () => {
        updateLastMessage({ streaming: false, content: buffer || '(Error occurred)' });
        setIsStreaming(false);
      }
    );

    stopRef.current = stop;
  }, [input, isStreaming, projectId, messages, addMessage, updateLastMessage, setIsStreaming]);

  const handleStop = () => {
    stopRef.current?.();
    setIsStreaming(false);
    updateLastMessage({ streaming: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    'Build a todo app with React',
    'Add a dark mode toggle',
    'Create a landing page',
    'Fix any TypeScript errors',
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">AI Chat</span>
          <Badge variant="secondary" className="text-xs">
            {projectId}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={clearMessages}
          title="Clear chat"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">What would you like to build?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Describe your idea and the AI will build it for you.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setInput(s);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            if (msg.role === 'tool') {
              return (
                <ToolCallCard
                  key={msg.id}
                  name={msg.toolName ?? 'tool'}
                  input={msg.toolInput}
                  result={msg.toolResult}
                />
              );
            }

            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  )}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm max-w-[85%]',
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted/60 text-foreground rounded-tl-sm'
                  )}
                >
                  {msg.streaming && !msg.content ? (
                    <TypingIndicator />
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }) {
                          const isInline = !className;
                          return isInline ? (
                            <code
                              className="rounded bg-background/40 px-1 py-0.5 font-mono text-xs"
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <pre className="rounded-lg bg-background/60 border border-border p-3 overflow-auto my-2">
                              <code className="font-mono text-xs" {...props}>
                                {children}
                              </code>
                            </pre>
                          );
                        },
                        p({ children }) {
                          return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
                        },
                        ul({ children }) {
                          return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                        },
                        ol({ children }) {
                          return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                  {msg.streaming && msg.content && (
                    <span className="inline-block ml-0.5 h-4 w-0.5 animate-pulse bg-current opacity-70" />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 focus-within:border-primary/60 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none leading-relaxed"
            style={{ minHeight: '24px' }}
          />
          {isStreaming ? (
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-red-400" onClick={handleStop}>
              <StopCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={sendMessage}
              disabled={!input.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Press <kbd className="rounded border border-border px-1 font-mono text-xs">Enter</kbd> to send,{' '}
          <kbd className="rounded border border-border px-1 font-mono text-xs">Shift+Enter</kbd> for newline
        </p>
      </div>
    </div>
  );
}
