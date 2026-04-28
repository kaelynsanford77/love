import React from 'react';
import { useStore, type Mode } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Eye, Files, Code2, Cloud, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const modes: { id: Mode; icon: React.ReactNode; label: string }[] = [
  { id: 'preview', icon: <Eye className="h-4 w-4" />, label: 'Preview' },
  { id: 'files', icon: <Files className="h-4 w-4" />, label: 'Files' },
  { id: 'code', icon: <Code2 className="h-4 w-4" />, label: 'Code' },
  { id: 'cloud', icon: <Cloud className="h-4 w-4" />, label: 'Cloud' },
  { id: 'analytics', icon: <BarChart2 className="h-4 w-4" />, label: 'Analytics' },
];

export function ModeSwitcher() {
  const { mode, setMode } = useStore();

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
        {modes.map((m) => (
          <Tooltip key={m.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode(m.id)}
                className={cn(
                  'h-7 gap-1.5 px-2.5 text-xs transition-all',
                  mode === m.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {m.icon}
                <span className="hidden sm:inline">{m.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{m.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
