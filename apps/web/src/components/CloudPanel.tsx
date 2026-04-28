import { useState } from 'react';
import { Table, Database, Shield, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABLES = ['users', 'posts', 'comments', 'sessions'];

const DEMO_DATA = {
  users: [
    { id: 1, email: 'alice@example.com', name: 'Alice Smith', created_at: '2024-01-01' },
    { id: 2, email: 'bob@example.com', name: 'Bob Jones', created_at: '2024-01-02' },
    { id: 3, email: 'carol@example.com', name: 'Carol White', created_at: '2024-01-03' },
  ],
};

const SUB_TABS = [
  { id: 'tables', label: 'Tables', icon: <Table size={13} /> },
  { id: 'sql', label: 'SQL', icon: <Database size={13} /> },
  { id: 'policies', label: 'Policies', icon: <Shield size={13} /> },
  { id: 'functions', label: 'Functions', icon: <Wrench size={13} /> },
];

export default function CloudPanel() {
  const [selectedTable, setSelectedTable] = useState('users');
  const [subTab, setSubTab] = useState('tables');
  const [sql, setSql] = useState('SELECT * FROM users LIMIT 10;');

  const data = DEMO_DATA[selectedTable as keyof typeof DEMO_DATA] ?? [];
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="flex h-full bg-[oklch(0.13_0_0)]">
      {/* Sidebar */}
      <div className="w-48 flex-shrink-0 border-r border-border bg-card overflow-y-auto">
        <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          Tables
        </div>
        {TABLES.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTable(t)}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors',
              selectedTable === t
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/20',
            )}
          >
            <Table size={11} />
            {t}
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sub-tab bar */}
        <div className="flex border-b border-border bg-card">
          {SUB_TABS.map((st) => (
            <button
              key={st.id}
              onClick={() => setSubTab(st.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-r border-border',
                subTab === st.id
                  ? 'bg-background text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {st.icon}
              {st.label}
            </button>
          ))}
        </div>

        {subTab === 'tables' && (
          <div className="flex-1 overflow-auto">
            {data.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-card sticky top-0">
                    {columns.map((c) => (
                      <th key={c} className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-accent/10 transition-colors">
                      {columns.map((c) => (
                        <td key={c} className="px-3 py-2 text-foreground">
                          {String((row as Record<string, unknown>)[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No data in this table
              </div>
            )}
          </div>
        )}

        {subTab === 'sql' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-border bg-card/50">
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                className="w-full h-32 bg-muted/50 border border-border rounded p-2 text-xs font-mono text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              <button className="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors">
                Run Query
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
              Results will appear here
            </div>
          </div>
        )}

        {(subTab === 'policies' || subTab === 'functions') && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            No {subTab} configured
          </div>
        )}
      </div>
    </div>
  );
}
