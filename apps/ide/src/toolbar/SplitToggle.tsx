import React from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Columns2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function SplitToggle() {
  const { splitView, toggleSplit } = useStore();

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSplit}
            className={cn('h-7 w-7', splitView ? 'text-primary bg-primary/10' : 'text-muted-foreground')}
          >
            <Columns2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{splitView ? 'Disable split view' : 'Enable split view'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
