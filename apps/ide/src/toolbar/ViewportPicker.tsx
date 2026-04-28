import React from 'react';
import { useStore, type Viewport } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const viewports: { id: Viewport; icon: React.ReactNode; label: string }[] = [
  { id: 'desktop', icon: <Monitor className="h-3.5 w-3.5" />, label: 'Desktop' },
  { id: 'tablet', icon: <Tablet className="h-3.5 w-3.5" />, label: 'Tablet (768px)' },
  { id: 'mobile', icon: <Smartphone className="h-3.5 w-3.5" />, label: 'Mobile (390px)' },
  { id: 'fullscreen', icon: <Maximize2 className="h-3.5 w-3.5" />, label: 'Fullscreen' },
];

export function ViewportPicker() {
  const { viewport, setViewport, mode } = useStore();
  if (mode !== 'preview') return null;

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex items-center gap-0.5">
        {viewports.map((v) => (
          <Tooltip key={v.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewport(v.id)}
                className={cn(
                  'h-7 w-7',
                  viewport === v.id ? 'text-foreground bg-muted' : 'text-muted-foreground'
                )}
              >
                {v.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{v.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
