import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Mic,
  MicOff,
  X,
  FileCode,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { Project, ChatMessage, ModelTier } from "../types";
import type { Toast } from "../types";
import { streamChat } from "../api";
import { cn, randomUUID } from "../utils";

interface ChatPanelProps {
  project: Project | null;
  onToast: (toast: Omit<Toast, "id">) => void;
  onFilesChanged: (files: string[]) => void;
  isMobile: boolean;
  onClose?: () => void;
}

const TIER_COLORS: Record<ModelTier, string> = {
  fast: "text-emerald-400 bg-emerald-400/10",
  standard: "text-blue-400 bg-blue-400/10",
  powerful: "text-purple-400 bg-purple-400/10",
};
const TIER_EMOJI: Record<ModelTier, string> = { fast: "🟢", standard: "🔵", powerful: "🟣" };
const TIER_LABEL: Record<ModelTier, string> = { fast: "Fast", standard: "Standard", powerful: "Powerful" };

function ModelBadge({ tier, model }: { tier?: ModelTier; model?: string }) {
  if (!tier) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium", TIER_COLORS[tier])}>
      {TIER_EMOJI[tier]} {TIER_LABEL[tier]}
    </span>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2 animate-fade-in", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-white">AI</span>
        </div>
      )}
      <div className={cn("max-w-[85%] flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-xl px-3 py-2 text-sm leading-relaxed",
            isUser
              ? "bg-brand-600 text-white rounded-br-sm"
              : "bg-[#1a1a1d] text-[#e8e8ed] rounded-bl-sm border border-[#2d2d32]"
          )}
        >
          {msg.status === "streaming" ? (
            <span>
              {msg.content}
              <span className="cursor-blink ml-0.5">▋</span>
            </span>
          ) : (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          )}
        </div>

        {msg.filesChanged && msg.filesChanged.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {msg.filesChanged.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-[#242428] border border-[#3d3d44] rounded text-[#9898a5]"
              >
                <FileCode size={10} />
                {f.split("/").pop()}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 px-1">
          {msg.modelTier && <ModelBadge tier={msg.modelTier} model={msg.modelName} />}
          {msg.status === "error" && (
            <span className="text-[10px] text-red-400 flex items-center gap-0.5">
              <AlertCircle size={10} /> Error
            </span>
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-6 h-6 rounded-full bg-[#2d2d32] flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-white">U</span>
        </div>
      )}
    </div>
  );
}

export function ChatPanel({
  project,
  onToast,
  onFilesChanged,
  isMobile,
  onClose,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [offline, setOffline] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    if (!project) {
      onToast({ type: "error", title: "No project selected", message: "Create or select a project first." });
      return;
    }

    const userMsg: ChatMessage = {
      id: randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const assistantMsg: ChatMessage = {
      id: randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      status: "streaming",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    try {
      let content = "";
      let tier: ModelTier | undefined;
      let modelName: string | undefined;
      let filesChanged: string[] = [];

      for await (const event of streamChat(project.id, history, { fileCount: 0, turns: messages.length })) {
        if (event.type === "model") {
          tier = event.tier as ModelTier;
          modelName = event.model;
        } else if (event.type === "text") {
          content += event.content;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content, modelTier: tier, modelName }
                : m
            )
          );
        } else if (event.type === "files_changed") {
          filesChanged = event.files ?? [];
          onFilesChanged(filesChanged);
        } else if (event.type === "done") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, status: "done", filesChanged }
                : m
            )
          );
        } else if (event.type === "error") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, status: "error", content: m.content || "An error occurred." }
                : m
            )
          );
          onToast({ type: "error", title: "LLM Error", message: event.message });
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, status: "error", content: "Failed to connect to the AI. Check your settings." }
            : m
        )
      );
      onToast({ type: "error", title: "Connection error", message: "Could not reach the orchestrator." });
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, project, onToast, onFilesChanged]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      onToast({ type: "error", title: "Voice not supported", message: "Your browser doesn't support speech recognition." });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognitionCtor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      setInput((prev: string) => (prev ? prev + " " + transcript : transcript));
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f10]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2d2d32]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Chat</span>
          {offline && (
            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/20">
              Offline
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMessages([])}
            className="text-[11px] px-2 py-0.5 rounded text-[#9898a5] hover:text-[#e8e8ed] hover:bg-[#1a1a1d] transition-colors"
          >
            Clear
          </button>
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-[#9898a5] hover:text-[#e8e8ed] hover:bg-[#1a1a1d]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#e8e8ed]">
                {project ? `Building ${project.name}` : "No project selected"}
              </p>
              <p className="text-xs text-[#9898a5] mt-1">
                {project
                  ? "Describe what you want to build or change"
                  : "Select or create a project to start chatting"}
              </p>
            </div>
            {project && (
              <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                {["Add a dark mode toggle", "Create a login form", "Add TypeScript types"].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[#2d2d32] text-[#9898a5] hover:text-[#e8e8ed] hover:border-[#3d3d44] transition-colors"
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-[#9898a5]">
            <Loader2 size={12} className="animate-spin-slow" />
            <span>AI is thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#2d2d32]">
        <div className="flex items-end gap-2 bg-[#1a1a1d] rounded-xl border border-[#2d2d32] focus-within:border-brand-500/50 transition-colors px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={project ? "Describe your changes…" : "Select a project first"}
            disabled={!project || isStreaming}
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#e8e8ed] placeholder-[#9898a5] resize-none outline-none min-h-[24px] max-h-[120px]"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
          />
          <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
            <button
              onClick={toggleVoice}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isListening
                  ? "text-red-400 bg-red-400/10 animate-pulse-slow"
                  : "text-[#9898a5] hover:text-[#e8e8ed] hover:bg-[#242428]"
              )}
              title="Voice input"
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming || !project}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                input.trim() && !isStreaming && project
                  ? "text-white bg-brand-600 hover:bg-brand-500"
                  : "text-[#9898a5] bg-[#242428] opacity-50 cursor-not-allowed"
              )}
            >
              {isStreaming ? <Loader2 size={15} className="animate-spin-slow" /> : <Send size={15} />}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-[#9898a5] mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
