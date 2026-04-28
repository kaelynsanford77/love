import React from "react";
import { MessageSquare, Eye, Code2, Cloud, Plus } from "lucide-react";
import type { ActiveMode } from "../types";
import { cn } from "../utils";

interface MobileBottomNavProps {
  activeMode: ActiveMode;
  onModeChange: (mode: ActiveMode) => void;
  onChatOpen: () => void;
}

const NAV_ITEMS = [
  { id: "chat" as ActiveMode, label: "Chat", icon: MessageSquare },
  { id: "preview" as ActiveMode, label: "Preview", icon: Eye },
  { id: "code" as ActiveMode, label: "Code", icon: Code2 },
  { id: "cloud" as ActiveMode, label: "Cloud", icon: Cloud },
];

export function MobileBottomNav({ activeMode, onModeChange, onChatOpen }: MobileBottomNavProps) {
  return (
    <nav className="flex items-center justify-around border-t border-[#2d2d32] bg-[#0f0f10] safe-bottom h-14 flex-shrink-0">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => {
            if (id === "chat") onChatOpen();
            onModeChange(id);
          }}
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors",
            activeMode === id ? "text-brand-400" : "text-[#9898a5]"
          )}
        >
          <Icon size={20} />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
