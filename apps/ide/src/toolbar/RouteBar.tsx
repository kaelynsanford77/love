import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw, Globe } from 'lucide-react';

export function RouteBar() {
  const { route, setRoute, mode } = useStore();
  const [draft, setDraft] = useState(route);

  if (mode !== 'preview') return null;

  const commit = () => setRoute(draft);

  return (
    <div className="flex items-center gap-1 flex-1 max-w-xs">
      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        onBlur={commit}
        className="h-7 text-xs bg-muted/40 border-0 focus-visible:ring-1"
        placeholder="/"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={commit}
        title="Refresh"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
