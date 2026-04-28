import React from 'react';
import { GitBranch, GitCommit, RotateCcw, GitFork, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIDEStore } from '@/store/useIDEStore';
import { cn } from '@/lib/utils';

export function HistoryPanel() {
  const { snapshots, restoreSnapshot, forkFromSnapshot, currentSnapshotIndex } = useIDEStore();

  if (snapshots.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <GitBranch className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No history yet</p>
          <p className="text-xs text-muted-foreground">Changes will be tracked as you work</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">History</span>
          <span className="text-xs text-muted-foreground">({snapshots.length} snapshots)</span>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />

          <div className="space-y-1">
            {[...snapshots].reverse().map((snapshot, idx) => {
              const reverseIdx = snapshots.length - 1 - idx;
              const isCurrent = reverseIdx === currentSnapshotIndex;

              return (
                <div key={snapshot.id} className="relative flex items-start gap-3 group">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-background',
                      isCurrent ? 'border-primary' : 'border-border'
                    )}
                  >
                    <GitCommit className={cn('w-3 h-3', isCurrent ? 'text-primary' : 'text-muted-foreground')} />
                  </div>

                  <div className="flex-1 min-w-0 pb-3">
                    <p className={cn('text-sm truncate', isCurrent && 'font-medium')}>{snapshot.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(snapshot.timestamp).toLocaleTimeString()}
                    </div>

                    <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] gap-1"
                        onClick={() => restoreSnapshot(snapshot.id)}
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] gap-1"
                        onClick={() => forkFromSnapshot(snapshot.id)}
                      >
                        <GitFork className="w-2.5 h-2.5" />
                        Fork
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
