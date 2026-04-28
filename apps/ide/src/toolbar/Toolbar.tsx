import React from 'react';
import { ProjectSwitcher } from './ProjectSwitcher';
import { ModeSwitcher } from './ModeSwitcher';
import { ViewportPicker } from './ViewportPicker';
import { RouteBar } from './RouteBar';
import { SplitToggle } from './SplitToggle';
import { HistoryButton } from './HistoryButton';
import { ActionsRight } from './ActionsRight';
import { useStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

export function Toolbar() {
  const { runtimeStatus } = useStore();

  const statusColors = {
    running: 'text-green-400',
    stopped: 'text-muted-foreground',
    error: 'text-red-400',
  };

  return (
    <header
      className="flex items-center gap-2 border-b border-border bg-background/95 backdrop-blur px-3"
      style={{ height: 'var(--toolbar-height)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-1.5 mr-1">
        <div className="rounded-md bg-primary/20 p-1">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold text-sm hidden md:block">Lovable Solo</span>
      </div>

      <div className="h-5 w-px bg-border mx-0.5" />

      {/* Project */}
      <ProjectSwitcher />

      <div className="h-5 w-px bg-border mx-0.5" />

      {/* Modes */}
      <ModeSwitcher />

      {/* Viewport & route (preview only) */}
      <div className="flex items-center gap-1 ml-1">
        <ViewportPicker />
        <RouteBar />
      </div>

      <div className="flex-1" />

      {/* Status badge */}
      <Badge
        variant={runtimeStatus === 'running' ? 'success' : runtimeStatus === 'error' ? 'destructive' : 'secondary'}
        className="text-xs"
      >
        <span
          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusColors[runtimeStatus]} ${runtimeStatus === 'running' ? 'animate-pulse' : ''}`}
          style={{ background: 'currentColor' }}
        />
        {runtimeStatus}
      </Badge>

      {/* Right actions */}
      <SplitToggle />
      <HistoryButton />
      <div className="h-5 w-px bg-border mx-0.5" />
      <ActionsRight />
    </header>
  );
}
