import React from 'react';
import { MessageSquare, Eye, Code2, Cloud, MoreHorizontal } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Mode } from '@/lib/store';

const tabs: { label: string; icon: React.ReactNode; mode: Mode }[] = [
  { label: 'Chat', icon: <MessageSquare className="h-5 w-5" />, mode: 'preview' },
  { label: 'Preview', icon: <Eye className="h-5 w-5" />, mode: 'preview' },
  { label: 'Code', icon: <Code2 className="h-5 w-5" />, mode: 'code' },
  { label: 'Cloud', icon: <Cloud className="h-5 w-5" />, mode: 'cloud' },
  { label: 'More', icon: <MoreHorizontal className="h-5 w-5" />, mode: 'analytics' },
];

export function MobileBottomNav() {
  const { mode, setMode } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb md:hidden">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setMode(tab.mode)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 min-w-[44px] min-h-[44px] transition-colors ${
              mode === tab.mode
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={tab.label}
          >
            {tab.icon}
            <span className="text-[10px] leading-none">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
