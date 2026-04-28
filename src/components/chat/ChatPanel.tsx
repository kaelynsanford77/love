import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Paperclip,
  Image,
  Link,
  FileText,
  Undo2,
  Trash2,
  Globe,
  Camera,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useIDEStore } from '@/store/useIDEStore';
import { cn } from '@/lib/utils';
import type { Attachment } from '@/types';

function simulateAIResponse(userMsg: string, attachments: Attachment[]): string {
  const lower = userMsg.toLowerCase();

  // URL-to-clone detection
  const urlMatch = userMsg.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    return `📋 I'll clone the design from **${urlMatch[0]}**!\n\nAnalyzing the page layout, colors, and components...\n\nHere's what I've generated:\n- Header with navigation\n- Hero section with gradient\n- Feature cards grid\n- Footer with links\n\nThe code has been updated in \`src/App.tsx\`. Check the preview!`;
  }

  // Screenshot/image handling
  if (attachments.some(a => a.type === 'image')) {
    return `📸 I can see the screenshot you shared! Let me analyze it...\n\nI've identified:\n- A card-based layout with shadows\n- Purple accent colors\n- Rounded corners and modern typography\n- A call-to-action button\n\nI've generated matching React + Tailwind code in \`src/App.tsx\`. The preview should now match your screenshot!`;
  }

  // File attachment
  if (attachments.some(a => a.type === 'file')) {
    return `📎 Thanks for sharing that file! I've used it as context for my response.\n\nBased on the file contents, I've updated the code accordingly.`;
  }

  if (lower.includes('button')) {
    return `I've added a beautiful button component! Here's what I did:\n\n- Added a primary button with hover effects\n- Included proper accessibility attributes\n- Used Tailwind CSS for styling\n\nCheck the preview to see it in action! 🎨`;
  }

  if (lower.includes('form') || lower.includes('input')) {
    return `I've created a form for you! Features:\n\n- Clean input fields with labels\n- Validation states\n- Submit button with loading state\n- Responsive layout\n\nThe code is in \`src/App.tsx\`. 📝`;
  }

  if (lower.includes('dark') || lower.includes('theme')) {
    return `🌙 Dark mode has been implemented!\n\n- Toggle between light and dark themes\n- Colors automatically adjust\n- Smooth transition animations\n\nTry clicking the theme toggle in the preview!`;
  }

  return `I've made the changes you requested! Here's what I did:\n\n1. Updated the component structure\n2. Applied modern styling with Tailwind\n3. Added responsive breakpoints\n4. Ensured accessibility best practices\n\nCheck the preview to see the result. Let me know if you'd like any adjustments! ✨`;
}

export function ChatPanel() {
  const {
    messages,
    isAiThinking,
    addMessage,
    setAiThinking,
    undoToMessage,
    clearMessages,
    runtimeErrors,
    clearRuntimeErrors,
    runSubAgents,
  } = useIDEStore();

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleSend = useCallback(() => {
    if (!input.trim() && attachments.length === 0) return;

    addMessage({
      role: 'user',
      content: input,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    const currentInput = input;
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setAiThinking(true);

    // Simulate AI response
    setTimeout(() => {
      const response = simulateAIResponse(currentInput, currentAttachments);
      addMessage({ role: 'assistant', content: response });
      setAiThinking(false);

      // Run sub-agents after AI response
      setTimeout(() => runSubAgents(), 500);
    }, 1500 + Math.random() * 1000);
  }, [input, attachments, addMessage, setAiThinking, runSubAgents]);

  const handleFixError = (error: string) => {
    setInput(`Fix this error: ${error}`);
    clearRuntimeErrors();
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setAttachments((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                type: 'image',
                name: file.name || 'screenshot.png',
                content: ev.target?.result as string,
                mimeType: file.type,
              },
            ]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachments((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type,
          name: file.name,
          content: type === 'image' ? (ev.target?.result as string) : (ev.target?.result as string),
          mimeType: file.type,
        },
      ]);
    };
    if (type === 'image') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const addUrlAttachment = () => {
    const url = prompt('Enter URL to attach:');
    if (url) {
      setAttachments((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'url',
          name: url,
          content: url,
        },
      ]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-10 border-b border-border flex items-center px-3 shrink-0">
        <span className="text-sm font-medium">AI Chat</span>
        <div className="flex-1" />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={clearMessages} title="Clear chat">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Runtime error banners */}
      {runtimeErrors.length > 0 && (
        <div className="border-b border-destructive/50 bg-destructive/10 p-2 space-y-1">
          {runtimeErrors.slice(0, 3).map((err) => (
            <div key={err.id} className="flex items-start gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
              <span className="text-red-400 flex-1 font-mono truncate">{err.message}</span>
              <Button
                size="sm"
                variant="destructive"
                className="h-5 text-[10px] px-2 shrink-0"
                onClick={() => handleFixError(err.message)}
              >
                Fix this
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
              <div
                className={cn(
                  'rounded-lg px-3 py-2 text-sm max-w-[85%] relative group',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : msg.role === 'system'
                    ? 'bg-muted text-muted-foreground text-xs italic'
                    : 'bg-card border border-border'
                )}
              >
                {/* Attachments display */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-1">
                        {att.type === 'image' ? (
                          <img
                            src={att.content}
                            alt={att.name}
                            className="w-32 h-20 object-cover rounded border border-border"
                          />
                        ) : att.type === 'url' ? (
                          <Badge variant="outline" className="text-[10px]">
                            <Globe className="w-2.5 h-2.5 mr-1" />
                            {att.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            <FileText className="w-2.5 h-2.5 mr-1" />
                            {att.name}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Message content with simple markdown */}
                <div className="whitespace-pre-wrap">
                  {msg.content.split('\n').map((line, i) => {
                    // Bold
                    const parts = line.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <div key={i}>
                        {parts.map((part, j) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j}>{part.slice(2, -2)}</strong>;
                          }
                          // Inline code
                          const codeParts = part.split(/(`[^`]+`)/g);
                          return codeParts.map((cp, k) => {
                            if (cp.startsWith('`') && cp.endsWith('`')) {
                              return (
                                <code key={k} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                                  {cp.slice(1, -1)}
                                </code>
                              );
                            }
                            return <span key={k}>{cp}</span>;
                          });
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Undo button for AI messages */}
                {msg.role === 'assistant' && msg.snapshotId && (
                  <button
                    className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full p-1 hover:bg-accent"
                    onClick={() => undoToMessage(msg.id)}
                    title="Undo this change"
                  >
                    <Undo2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isAiThinking && (
            <div className="flex gap-2">
              <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="border-t border-border px-3 py-2 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group bg-muted rounded-lg overflow-hidden flex items-center gap-1 pr-2"
            >
              {att.type === 'image' ? (
                <img src={att.content} alt={att.name} className="w-12 h-8 object-cover" />
              ) : att.type === 'url' ? (
                <div className="px-2 py-1">
                  <Globe className="w-3 h-3 inline mr-1" />
                </div>
              ) : (
                <div className="px-2 py-1">
                  <FileText className="w-3 h-3 inline mr-1" />
                </div>
              )}
              <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{att.name}</span>
              <button
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => removeAttachment(att.id)}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-end gap-2">
          {/* Attachment menu */}
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            {showAttachMenu && (
              <div className="absolute bottom-10 left-0 bg-popover border border-border rounded-lg shadow-lg py-1 w-44 z-10">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-accent text-left"
                  onClick={() => {
                    imageInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                >
                  <Image className="w-4 h-4" /> Upload Image
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-accent text-left"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                >
                  <FileText className="w-4 h-4" /> Attach File
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-accent text-left"
                  onClick={() => {
                    addUrlAttachment();
                    setShowAttachMenu(false);
                  }}
                >
                  <Link className="w-4 h-4" /> Attach URL
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm w-full hover:bg-accent text-left"
                  onClick={() => {
                    navigator.clipboard.read?.().then(() => {
                      // Trigger paste from clipboard
                    });
                    setShowAttachMenu(false);
                  }}
                >
                  <Camera className="w-4 h-4" /> Paste Screenshot
                </button>
              </div>
            )}
          </div>

          <textarea
            className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[40px] max-h-[120px]"
            placeholder="Describe what you want to build... (paste screenshots here!)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onPaste={handlePaste}
            rows={1}
          />

          <Button size="icon" className="h-8 w-8" onClick={handleSend} disabled={isAiThinking}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Tip: Paste screenshots, attach files/URLs, or type a website URL to clone
        </p>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'image')}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'file')}
      />
    </div>
  );
}
