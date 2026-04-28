import { useState, useEffect } from "react";
import { Database, Table, Code, Shield, RefreshCw, Plus, Link2, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface CloudPanelProps {
  projectId: string | null;
}

type CloudTab = "tables" | "sql" | "rls" | "types";

interface SupabaseLink {
  connected: boolean;
  project_url?: string;
  mode?: string;
  connected_at?: number;
}

export function CloudPanel({ projectId }: CloudPanelProps) {
  const [link, setLink] = useState<SupabaseLink | null>(null);
  const [activeTab, setActiveTab] = useState<CloudTab>("tables");
  const [tables, setTables] = useState<string[]>([]);
  const [showConnectWizard, setShowConnectWizard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    api.get<SupabaseLink>(`/supabase/${projectId}`)
      .then(setLink)
      .catch(() => setLink({ connected: false }))
      .finally(() => setIsLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !link?.connected) return;
    api.get<{ tables: string[] }>(`/supabase/${projectId}/tables`)
      .then(({ tables }) => setTables(tables))
      .catch(() => {});
  }, [projectId, link]);

  if (!projectId) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <Database size={40} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">Select a project to manage its database.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!link?.connected) {
    return (
      <div className="flex flex-col h-full">
        {showConnectWizard ? (
          <ConnectWizard
            projectId={projectId}
            onConnected={(l) => { setLink(l); setShowConnectWizard(false); }}
            onCancel={() => setShowConnectWizard(false)}
          />
        ) : (
          <EmptyCloudState onConnect={() => setShowConnectWizard(true)} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Supabase Connected</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 truncate max-w-40">{link.project_url}</span>
          <button
            onClick={() => {
              api.post("/supabase/disconnect", { projectId })
                .then(() => setLink({ connected: false }))
                .catch(() => toast.error("Disconnect failed"));
            }}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        {[
          { id: "tables" as CloudTab, icon: Table, label: "Tables" },
          { id: "sql" as CloudTab, icon: Code, label: "SQL" },
          { id: "rls" as CloudTab, icon: Shield, label: "RLS" },
          { id: "types" as CloudTab, icon: Code, label: "Types" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors border-b-2",
              activeTab === id
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "tables" && (
          <TablesView projectId={projectId} tables={tables} />
        )}
        {activeTab === "sql" && (
          <SQLView projectId={projectId} />
        )}
        {activeTab === "rls" && (
          <RLSView />
        )}
        {activeTab === "types" && (
          <TypesView projectId={projectId} />
        )}
      </div>
    </div>
  );
}

function EmptyCloudState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center">
      <Database size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
        No database connected
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
        Connect Supabase to browse tables, run SQL queries, and manage your database.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onConnect}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
        >
          <Link2 size={16} />
          Connect Supabase
        </button>
        <button
          onClick={() => window.open("https://supabase.com", "_blank")}
          className="px-4 py-2.5 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
        >
          Create new Supabase project
        </button>
      </div>
    </div>
  );
}

function ConnectWizard({
  projectId,
  onConnected,
  onCancel,
}: {
  projectId: string;
  onConnected: (link: SupabaseLink) => void;
  onCancel: () => void;
}) {
  const [projectUrl, setProjectUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [serviceRoleKey, setServiceRoleKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTest = async () => {
    if (!projectUrl || !anonKey) { toast.error("URL and anon key required"); return; }
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await api.post<{ ok: boolean; tables?: string[] }>("/supabase/test", { projectUrl, anonKey });
      setTestResult({ ok: result.ok, message: result.ok ? `Connected! Found ${result.tables?.length || 0} tables.` : "Connection failed" });
    } catch (e) {
      setTestResult({ ok: false, message: String(e) });
    }
    setIsTesting(false);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await api.post("/supabase/connect", { projectId, projectUrl, anonKey, serviceRoleKey: serviceRoleKey || undefined, mode: "cloud" });
      toast.success("Supabase connected!");
      onConnected({ connected: true, project_url: projectUrl });
    } catch (e) {
      toast.error(`Connection failed: ${e}`);
    }
    setIsConnecting(false);
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Connect Supabase</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Project URL
          </label>
          <input
            type="url"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            placeholder="https://xxxxx.supabase.co"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Anon Key (public)
          </label>
          <input
            type="password"
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            placeholder="eyJ..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Service Role Key (optional, stored encrypted)
          </label>
          <input
            type="password"
            value={serviceRoleKey}
            onChange={(e) => setServiceRoleKey(e.target.value)}
            placeholder="eyJ..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {testResult && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
            testResult.ok
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
          )}>
            {testResult.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {testResult.message}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleTest}
            disabled={isTesting || !projectUrl || !anonKey}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors font-medium"
          >
            {isTesting ? "Testing..." : "Test Connection"}
          </button>
          <button
            onClick={handleConnect}
            disabled={isConnecting || !projectUrl || !anonKey}
            className="flex-1 px-4 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TablesView({ projectId, tables }: { projectId: string; tables: string[] }) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRows = async (table: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post<{ data: unknown[] }>(`/supabase/${projectId}/query`, { table, limit: 50 });
      setRows(Array.isArray(data) ? data : []);
    } catch {}
    setIsLoading(false);
  };

  const handleSelectTable = (table: string) => {
    setSelectedTable(table);
    fetchRows(table);
  };

  if (tables.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <Table size={40} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No tables found in this database.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-48 border-r border-gray-100 dark:border-gray-800 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tables</div>
        {tables.map((t) => (
          <button
            key={t}
            onClick={() => handleSelectTable(t)}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors",
              selectedTable === t
                ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <Table size={12} /> {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedTable && rows.length > 0 ? (
          <DataGrid rows={rows as Record<string, unknown>[]} />
        ) : selectedTable ? (
          <div className="text-sm text-gray-500 text-center py-8">No rows found.</div>
        ) : (
          <div className="text-sm text-gray-500 text-center py-8">Select a table to view data.</div>
        )}
      </div>
    </div>
  );
}

function DataGrid({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                  {String(row[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SQLView({ projectId }: { projectId: string }) {
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSQL = async () => {
    if (!sql.trim()) return;
    setIsRunning(true);
    setError(null);
    try {
      const { data } = await api.post<{ data: unknown }>(`/supabase/${projectId}/query`, { sql });
      setResult(data);
    } catch (e) {
      setError(String(e));
    }
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex flex-col gap-2">
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="SELECT * FROM users LIMIT 10;"
          rows={6}
          className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
        <button
          onClick={runSQL}
          disabled={isRunning || !sql.trim()}
          className="self-end flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {isRunning ? "Running..." : "Run Query"}
        </button>
      </div>
      {error && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">{error}</div>
      )}
      {result !== null && !error && (
        <div className="flex-1 overflow-auto">
          {Array.isArray(result) && result.length > 0 ? (
            <DataGrid rows={result as Record<string, unknown>[]} />
          ) : (
            <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function RLSView() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <Shield size={40} className="text-gray-300 mb-3" />
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Row Level Security</h3>
      <p className="text-xs text-gray-500 max-w-xs">
        Manage RLS policies directly in your Supabase dashboard. Ask AI to generate RLS policies for you in the chat.
      </p>
      <button
        onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
        className="mt-4 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        Open Supabase Dashboard
      </button>
    </div>
  );
}

function TypesView({ projectId }: { projectId: string }) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const regenerate = async () => {
    setIsRegenerating(true);
    try {
      await api.post(`/supabase/${projectId}/regenerate-types`, {});
      toast.success("Types regenerated!");
    } catch (e) {
      toast.error(`Failed: ${e}`);
    }
    setIsRegenerating(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <Code size={40} className="text-gray-300 mb-3" />
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">TypeScript Types</h3>
      <p className="text-xs text-gray-500 max-w-xs mb-4">
        TypeScript types are auto-generated from your Supabase schema.
        Files are in <code>src/integrations/supabase/types.ts</code>.
      </p>
      <button
        onClick={regenerate}
        disabled={isRegenerating}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        <RefreshCw size={14} className={isRegenerating ? "animate-spin" : ""} />
        {isRegenerating ? "Regenerating..." : "Regenerate Types"}
      </button>
    </div>
  );
}
