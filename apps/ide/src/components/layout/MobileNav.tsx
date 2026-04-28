import { MessageSquare, Globe, Code2, MoreHorizontal } from "lucide-react";
import { useProjectStore, type PanelMode } from "@/stores/projectStore";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  onChatOpen: () => void;
}

const TABS = [
  { id: "chat" as PanelMode, icon: MessageSquare, label: "Chat", special: true },
  { id: "preview" as PanelMode, icon: Globe, label: "Preview" },
  { id: "code" as PanelMode, icon: Code2, label: "Code" },
  { id: "cloud" as PanelMode, icon: MoreHorizontal, label: "More" },
];

export function MobileNav({ onChatOpen }: MobileNavProps) {
  const { panelMode, setPanelMode } = useProjectStore();

  return (
    <nav className="flex items-center border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 safe-bottom shrink-0">
      {TABS.map(({ id, icon: Icon, label, special }) => (
        <button
          key={id}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px]",
            panelMode === id
              ? "text-purple-600 dark:text-purple-400"
              : "text-gray-500 dark:text-gray-400"
          )}
          onClick={() => {
            if (id === "chat") {
              onChatOpen();
            } else {
              setPanelMode(id);
            }
          }}
        >
          <Icon
            size={20}
            className={cn(
              panelMode === id && "fill-purple-100 dark:fill-purple-900/50"
            )}
          />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
