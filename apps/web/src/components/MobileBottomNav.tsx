import { Globe, Code2, Cloud, MessageSquare, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Mode } from '@/App';

interface MobileBottomNavProps {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  chatOpen: boolean;
  onChatToggle: () => void;
}

const NAV_ITEMS: Array<{
  id: Mode | 'chat';
  icon: React.ReactNode;
  label: string;
}> = [
  { id: 'chat', icon: <MessageSquare size={20} />, label: 'Chat' },
  { id: 'preview', icon: <Globe size={20} />, label: 'Preview' },
  { id: 'code', icon: <Code2 size={20} />, label: 'Code' },
  { id: 'cloud', icon: <Cloud size={20} />, label: 'Cloud' },
  { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Stats' },
];

export default function MobileBottomNav({
  mode,
  onModeChange,
  chatOpen,
  onChatToggle,
}: MobileBottomNavProps) {
  function handleTap(id: Mode | 'chat') {
    if (id === 'chat') {
      onChatToggle();
    } else {
      onModeChange(id as Mode);
      if (chatOpen) onChatToggle();
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] flex items-center bg-card border-t border-border safe-area-bottom md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.id === 'chat' ? chatOpen : !chatOpen && mode === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleTap(item.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 px-1 transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {item.icon}
            <span className="text-[9px] font-medium">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
