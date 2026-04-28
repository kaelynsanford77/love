import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Table2, Shield, Play, Plus, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface TableInfo {
  name: string;
  columns: { name: string; type: string; nullable: boolean }[];
  rowCount: number;
}

function TablesTab() {
  const { projectId } = useStore();
  const { data: tables = [], isLoading, refetch } = useQuery({
    queryKey: ['db-tables', projectId],
    queryFn: () =>
      api
        .get<{ tables: TableInfo[] }>(`/cloud/tables?projectId=${encodeURIComponent(projectId)}`)
        .then((r) => r.tables ?? []),
  });

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Database Tables</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
          <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}

      {!isLoading && tables.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Database className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm text-muted-foreground">No tables yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Configure DATABASE_URL in .env to connect
          </p>
        </div>
      )}

      {tables.map((table) => (
        <div key={table.name} className="rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
            <Table2 className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{table.name}</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {table.rowCount.toLocaleString()} rows
            </Badge>
          </div>
          <div className="divide-y divide-border">
            {table.columns.map((col) => (
              <div key={col.name} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                <span className="text-foreground/90 font-medium w-36 truncate">{col.name}</span>
                <span className="text-primary font-mono">{col.type}</span>
                {!col.nullable && (
                  <Badge variant="outline" className="ml-auto text-xs py-0">
                    NOT NULL
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SQLTab() {
  const { projectId } = useStore();
  const [query, setQuery] = useState('SELECT 1;');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [running, setRunning] = useState(false);

  const runQuery = async () => {
    setRunning(true);
    try {
      const res = await api.post<Record<string, unknown>>('/cloud/sql', { projectId, query });
      setResult(res);
    } catch (e: unknown) {
      toast.error('Query failed');
      setResult({ error: String(e) });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">SQL Editor</span>
          <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={runQuery} disabled={running}>
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Run
          </Button>
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="SELECT * FROM users LIMIT 10;"
        />
      </div>

      {result && (
        <div className="flex-1 min-h-0">
          <p className="text-xs text-muted-foreground mb-1">Result:</p>
          <ScrollArea className="h-48 rounded-lg border border-border bg-muted/20">
            <pre className="p-3 text-xs font-mono text-green-300">
              {JSON.stringify(result, null, 2)}
            </pre>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function RLSTab() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">Row Level Security</span>
      </div>
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p className="text-sm text-muted-foreground">RLS policy editor</p>
        <p className="text-xs text-muted-foreground mt-1">
          Connect a PostgreSQL database to manage RLS policies
        </p>
      </div>
    </div>
  );
}

function cn(...args: (string | undefined | false)[]) {
  return args.filter(Boolean).join(' ');
}

export function CloudPanel() {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
        <Database className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Cloud & Database</span>
      </div>

      <Tabs defaultValue="tables" className="flex flex-col flex-1 min-h-0">
        <TabsList className="mx-4 mt-2 justify-start h-8 shrink-0">
          <TabsTrigger value="tables" className="h-7 text-xs gap-1.5">
            <Table2 className="h-3.5 w-3.5" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="sql" className="h-7 text-xs gap-1.5">
            <Play className="h-3.5 w-3.5" />
            SQL
          </TabsTrigger>
          <TabsTrigger value="rls" className="h-7 text-xs gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            RLS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="flex-1 mt-0 overflow-auto">
          <TablesTab />
        </TabsContent>
        <TabsContent value="sql" className="flex-1 mt-0">
          <SQLTab />
        </TabsContent>
        <TabsContent value="rls" className="flex-1 mt-0">
          <RLSTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
