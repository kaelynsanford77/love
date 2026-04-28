import { useState, useRef, useEffect } from "react";
import { Send, Mic, Trash2, Sparkles, Square } from "lucide-react";
import { useChatStore, type ChatMessage as ChatMessageType } from "@/stores/chatStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ChatPanelProps {
  projectId: string | null;
}

const QUICK_ACTIONS = [
  "Fix any TypeScript errors",
  "Make it responsive",
  "Add a dark mode",
  "Add a new page",
  "Improve the styling",
];

const TIER_COLORS: Record<string, string> = {
  fast: "text-green-600 bg-green-50 dark:bg-green-900/20",
  standard: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  powerful: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
};

export function ChatPanel({ projectId }: ChatPanelProps) {
  const { getMessages, sendMessage, isStreaming, cancelStream } = useChatStore();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messages = projectId ? getMessages(projectId) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !projectId || isStreaming) return;
    sendMessage(projectId, input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      setInput((prev) => prev + e.results[0][0].transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  if (!projectId) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <div className="text-4xl mb-3">👋</div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
          Welcome to Lovable!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Create or select a project to start building with AI.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">AI Chat</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => projectId && useChatStore.getState().clearHistory(projectId)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Clear history"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyChat onQuickAction={(msg) => { setInput(msg); setTimeout(handleSend, 0); }} />
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none max-h-32 py-1 px-1"
            style={{ minHeight: "36px" }}
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleVoiceInput}
              className={cn(
                "p-2 rounded-xl transition-colors min-h-[36px] min-w-[36px]",
                isListening
                  ? "text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <Mic size={16} />
            </button>
            {isStreaming ? (
              <button
                onClick={cancelStream}
                className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors min-h-[36px] min-w-[36px]"
              >
                <Square size={16} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[36px] min-w-[36px]"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyChat({ onQuickAction }: { onQuickAction: (msg: string) => void }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="text-4xl mb-3">👋</div>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
        Hi! I'm your AI developer.
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
        Describe what you want to build and I'll create it for you!
      </p>
      <div className="flex flex-col gap-2 w-full">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => onQuickAction(action)}
            className="px-3 py-2 text-xs text-left bg-gray-50 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-600 dark:text-gray-400 hover:text-purple-700 dark:hover:text-purple-400 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: ChatMessageType }) {
  if (message.role === "tool_call") {
    return (
      <div className="flex items-start gap-2 animate-fade-in">
        <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs">🔧</span>
        </div>
        <div className="flex-1 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
          <div className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
            {message.toolName}
          </div>
          {message.toolArgs != null && (
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
              {JSON.stringify(message.toolArgs, null, 2).slice(0, 200)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[85%] bg-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-bold">
        ✦
      </div>
      <div className="flex-1 min-w-0">
        {message.tier && (
          <div className={cn(
            "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-2 font-medium",
            TIER_COLORS[message.tier] || "text-gray-600 bg-gray-100"
          )}>
            <span>
              {message.tier === "fast" ? "⚡" : message.tier === "standard" ? "🔵" : "🟣"}
            </span>
            {message.model?.split("-").slice(0, 2).join("-")}
          </div>
        )}
        <div className={cn(
          "text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words",
          message.isStreaming && "streaming-cursor"
        )}>
          {message.content || (message.isStreaming ? "" : "...")}
        </div>
      </div>
    </div>
  );
}
