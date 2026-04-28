import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { api } from "@/lib/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool_call";
  content: string;
  model?: string;
  tier?: string;
  toolName?: string;
  toolArgs?: unknown;
  toolResult?: unknown;
  timestamp: number;
  isStreaming?: boolean;
}

interface ChatState {
  messages: Record<string, ChatMessage[]>; // projectId -> messages
  isStreaming: boolean;
  currentModel: string | null;
  currentTier: string | null;
  stopStream: (() => void) | null;

  sendMessage: (projectId: string, content: string) => Promise<void>;
  clearHistory: (projectId: string) => void;
  getMessages: (projectId: string) => ChatMessage[];
  cancelStream: () => void;
}

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    messages: {},
    isStreaming: false,
    currentModel: null,
    currentTier: null,
    stopStream: null,

    getMessages: (projectId) => get().messages[projectId] || [],

    clearHistory: (projectId) => {
      api.delete(`/chat/${projectId}/history`).catch(() => {});
      set((s) => { s.messages[projectId] = []; });
    },

    cancelStream: () => {
      const stop = get().stopStream;
      if (stop) stop();
      set((s) => {
        s.isStreaming = false;
        s.stopStream = null;
        // Mark last message as done streaming
        const keys = Object.keys(s.messages);
        for (const key of keys) {
          const msgs = s.messages[key];
          const last = msgs[msgs.length - 1];
          if (last?.isStreaming) last.isStreaming = false;
        }
      });
    },

    sendMessage: async (projectId, content) => {
      const state = get();
      if (state.isStreaming) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      const assistantMsgId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      set((s) => {
        if (!s.messages[projectId]) s.messages[projectId] = [];
        s.messages[projectId].push(userMsg, assistantMsg);
        s.isStreaming = true;
      });

      const history = get()
        .getMessages(projectId)
        .filter((m) => m.role !== "tool_call")
        .slice(-20)
        .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));

      const stop = api.stream(
        `/chat/${projectId}`,
        { message: content, history },
        (event: any) => {
          if (event.type === "model") {
            set((s) => {
              s.currentModel = event.model;
              s.currentTier = event.tier;
              const msg = s.messages[projectId]?.find((m) => m.id === assistantMsgId);
              if (msg) {
                msg.model = event.model;
                msg.tier = event.tier;
              }
            });
          } else if (event.type === "delta") {
            set((s) => {
              const msg = s.messages[projectId]?.find((m) => m.id === assistantMsgId);
              if (msg) msg.content += event.content;
            });
          } else if (event.type === "tool_call") {
            const toolMsg: ChatMessage = {
              id: crypto.randomUUID(),
              role: "tool_call",
              content: `Using **${event.name}**`,
              toolName: event.name,
              toolArgs: event.args,
              toolResult: event.result,
              timestamp: Date.now(),
            };
            set((s) => {
              const idx = s.messages[projectId]?.findIndex((m) => m.id === assistantMsgId);
              if (idx !== undefined && idx >= 0) {
                s.messages[projectId].splice(idx, 0, toolMsg);
              }
            });
          } else if (event.type === "escalate") {
            set((s) => {
              const msg = s.messages[projectId]?.find((m) => m.id === assistantMsgId);
              if (msg) {
                msg.model = event.model;
                msg.tier = event.to;
                s.currentModel = event.model;
                s.currentTier = event.to;
              }
            });
          } else if (event.type === "done" || event.type === "error") {
            set((s) => {
              const msg = s.messages[projectId]?.find((m) => m.id === assistantMsgId);
              if (msg) msg.isStreaming = false;
              s.isStreaming = false;
              s.stopStream = null;
            });
          }
        }
      );

      set((s) => { s.stopStream = stop; });
    },
  }))
);
