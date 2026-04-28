import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, GitCommit, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export function HistoryButton() {
  const [open, setOpen] = useState(false);
  const { projectId } = useStore();

  const { data: commits = [], isLoading } = useQuery({
    queryKey: ['git-log', projectId],
    queryFn: () =>
      api
        .get<{ commits: Commit[] }>(`/git/log?projectId=${encodeURIComponent(projectId)}`)
        .then((r) => r.commits ?? []),
    enabled: open,
  });

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(true)}
          >
            <History className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Git history</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Git History
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96 pr-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading history…
              </div>
            )}
            {!isLoading && commits.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No commits yet</div>
            )}
            <div className="space-y-1">
              {commits.map((c) => (
                <div key={c.hash} className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/40">
                  <GitCommit className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{c.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {c.hash.slice(0, 7)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{c.author}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{c.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
