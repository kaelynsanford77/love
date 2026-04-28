import React from 'react';
import {
  Terminal,
  Globe,
  AlertTriangle,
  Info,
  AlertCircle,
  Trash2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useIDEStore } from '@/store/useIDEStore';
import { cn } from '@/lib/utils';

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function Inspector() {
  const {
    consoleEntries,
    networkRequests,
    clearConsoleEntries,
    clearNetworkRequests,
    activeInspectorTab,
    setActiveInspectorTab,
  } = useIDEStore();

  const consoleIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />;
      case 'warn':
        return <AlertTriangle className="w-3 h-3 text-yellow-400 shrink-0" />;
      case 'info':
        return <Info className="w-3 h-3 text-blue-400 shrink-0" />;
      default:
        return <Terminal className="w-3 h-3 text-muted-foreground shrink-0" />;
    }
  };

  const statusColor = (status?: number) => {
    if (!status) return 'text-muted-foreground';
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Tabs
      value={activeInspectorTab}
      onValueChange={(v) => setActiveInspectorTab(v as any)}
      className="h-full flex flex-col"
    >
      <div className="flex items-center border-b border-border px-2 shrink-0">
        <TabsList className="h-8 bg-transparent">
          <TabsTrigger value="console" className="text-xs h-7 data-[state=active]:bg-muted">
            <Terminal className="w-3 h-3 mr-1" />
            Console
            {consoleEntries.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">
                {consoleEntries.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="network" className="text-xs h-7 data-[state=active]:bg-muted">
            <Globe className="w-3 h-3 mr-1" />
            Network
            {networkRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">
                {networkRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <div className="flex-1" />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => {
            if (activeInspectorTab === 'console') clearConsoleEntries();
            else clearNetworkRequests();
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <TabsContent value="console" className="flex-1 mt-0">
        <ScrollArea className="h-full">
          <div className="p-1">
            {consoleEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No console output yet
              </p>
            ) : (
              consoleEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-start gap-2 px-2 py-0.5 text-xs font-mono hover:bg-accent/30',
                    entry.type === 'error' && 'bg-red-500/5',
                    entry.type === 'warn' && 'bg-yellow-500/5'
                  )}
                >
                  {consoleIcon(entry.type)}
                  <span className="text-muted-foreground text-[10px] shrink-0">
                    {formatTime(entry.timestamp)}
                  </span>
                  <span className="flex-1 break-all">{entry.args.join(' ')}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="network" className="flex-1 mt-0">
        <ScrollArea className="h-full">
          <div className="p-1">
            {networkRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No network requests yet
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left px-2 py-1 font-medium">Method</th>
                    <th className="text-left px-2 py-1 font-medium">URL</th>
                    <th className="text-left px-2 py-1 font-medium">Status</th>
                    <th className="text-left px-2 py-1 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {networkRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-accent/30 border-b border-border/50">
                      <td className="px-2 py-1">
                        <Badge variant="outline" className="text-[10px]">
                          {req.method}
                        </Badge>
                      </td>
                      <td className="px-2 py-1 truncate max-w-[200px] font-mono">{req.url}</td>
                      <td className={cn('px-2 py-1 font-mono', statusColor(req.status))}>
                        {req.status ?? '...'}
                      </td>
                      <td className="px-2 py-1 text-muted-foreground">
                        {req.duration ? `${req.duration}ms` : '...'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
