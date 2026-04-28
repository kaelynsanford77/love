import React, { useState, useEffect } from "react";
import { Database, Table, Code2, Shield, Loader2, CheckCircle2, Link, Unlink, Play } from "lucide-react";
import type { Project } from "../types";
import type { Toast } from "../types";
import { connectSupabase, getSupabaseStatus, runSupabaseQuery } from "../api";
import { cn } from "../utils";

interface CloudPanelProps {
  project: Project | null;
  onToast: (toast: Omit<Toast, "id">) => void;
  isMobile: boolean;
}

type CloudTab = "tables" | "sql" | "rls";
type WizardStep = "choose" | "connect" | "connecting" | "done";

interface SupabaseStatus {
  connected: boolean;
  url?: string;
  connectedAt?: string;
}

function ConnectWizard({
  project,
  onConnected,
  onToast,
}: {
  project: Project;
  onConnected: () => void;
  onToast: (toast: Omit<Toast, "id">) => void;
}) {
  const [step, setStep] = useState<WizardStep>("choose");
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (!url || !anonKey) {
      onToast({ type: "error", title: "URL and anon key are required" });
      return;
    }
    setConnecting(true);
    try {
      const res = await connectSupabase({ projectId: project.id, url, anonKey, serviceRoleKey: serviceKey || undefined });
      if (res.success) {
        onToast({ type: "success", title: "Supabase connected!" });
        onConnected();
      } else {
        onToast({ type: "error", title: res.error ?? "Connection failed" });
      }
    } catch {
      onToast({ type: "error", title: "Network error" });
    } finally {
      setConnecting(false);
    }
  };

  if (step === "choose") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Database size={28} className="text-emerald-400" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">Connect Supabase</h2>
          <p className="text-sm text-[#9898a5] mt-1">Add a database to your project</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            onClick={() => setStep("connect")}
            className="flex items-center gap-3 p-4 rounded-xl border border-[#2d2d32] bg-[#1a1a1d] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors text-left"
          >
            <Link size={18} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Connect existing project</p>
              <p className="text-xs text-[#9898a5]">Use your Supabase project URL and keys</p>
            </div>
          </button>
          <button
            disabled
            className="flex items-center gap-3 p-4 rounded-xl border border-[#2d2d32] bg-[#1a1a1d] opacity-40 cursor-not-allowed text-left"
          >
            <Database size={18} className="text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Create new project</p>
              <p className="text-xs text-[#9898a5]">Coming soon</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
      <div className="w-full max-w-sm">
        <h2 className="text-base font-semibold text-white mb-4">Connect Supabase Project</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-[#9898a5] mb-1 block">Project URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="w-full bg-[#1a1a1d] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#9898a5] mb-1 block">Anon Key</label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGci..."
              className="w-full bg-[#1a1a1d] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#9898a5] mb-1 block">
              Service Role Key <span className="opacity-50">(optional)</span>
            </label>
            <input
              type="password"
              value={serviceKey}
              onChange={(e) => setServiceKey(e.target.value)}
              placeholder="eyJhbGci..."
              className="w-full bg-[#1a1a1d] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setStep("choose")}
              className="flex-1 py-2 rounded-lg border border-[#2d2d32] text-sm text-[#9898a5] hover:text-white hover:bg-[#1a1a1d] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConnect}
              disabled={connecting || !url || !anonKey}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
                connecting || !url || !anonKey
                  ? "bg-[#2d2d32] text-[#9898a5] cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              )}
            >
              {connecting && <Loader2 size={14} className="animate-spin-slow" />}
              {connecting ? "Connecting…" : "Connect"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CloudPanel({ project, onToast, isMobile }: CloudPanelProps) {
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [activeTab, setActiveTab] = useState<CloudTab>("tables");
  const [sql, setSql] = useState("SELECT * FROM public.users LIMIT 10;");
  const [queryResult, setQueryResult] = useState<unknown>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const s = await getSupabaseStatus(project.id);
      setStatus(s);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatus(); }, [project?.id]);

  const runQuery = async () => {
    if (!project || !sql.trim()) return;
    setRunning(true);
    try {
      const result = await runSupabaseQuery(project.id, sql);
      setQueryResult(result);
    } catch {
      onToast({ type: "error", title: "Query failed" });
    } finally {
      setRunning(false);
    }
  };

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#9898a5] text-sm">
        Select a project to manage cloud services
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="text-[#9898a5] animate-spin-slow" />
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="flex-1 overflow-auto">
        <ConnectWizard project={project} onConnected={loadStatus} onToast={onToast} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2d32] flex-shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span className="text-sm font-medium text-white">Supabase Connected</span>
          <span className="text-xs text-[#9898a5] truncate max-w-[200px]">{status.url}</span>
        </div>
        <button
          onClick={() => setStatus({ connected: false })}
          className="text-xs text-[#9898a5] hover:text-red-400 flex items-center gap-1 transition-colors"
        >
          <Unlink size={12} />
          Disconnect
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2d2d32] flex-shrink-0">
        {[
          { id: "tables" as CloudTab, label: "Tables", icon: <Table size={13} /> },
          { id: "sql" as CloudTab, label: "SQL Editor", icon: <Code2 size={13} /> },
          { id: "rls" as CloudTab, label: "RLS", icon: <Shield size={13} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-brand-500 text-white"
                : "border-transparent text-[#9898a5] hover:text-[#e8e8ed]"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "tables" && (
          <div className="text-center py-12 text-[#9898a5] text-sm">
            <Table size={32} className="mx-auto mb-3 opacity-30" />
            <p>Table browser coming soon</p>
            <p className="text-xs mt-1 opacity-60">Connect and run SQL queries in the SQL tab</p>
          </div>
        )}

        {activeTab === "sql" && (
          <div className="flex flex-col gap-3 h-full">
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={6}
              className="w-full bg-[#1a1a1d] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors resize-none font-mono"
              placeholder="Enter SQL query..."
            />
            <button
              onClick={runQuery}
              disabled={running}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors self-start",
                running
                  ? "bg-[#2d2d32] text-[#9898a5] cursor-not-allowed"
                  : "bg-brand-600 hover:bg-brand-500 text-white"
              )}
            >
              {running ? <Loader2 size={14} className="animate-spin-slow" /> : <Play size={14} />}
              {running ? "Running…" : "Run Query"}
            </button>
            {queryResult !== null && (
              <div className="bg-[#1a1a1d] border border-[#2d2d32] rounded-lg p-3">
                <pre className="text-xs text-[#e8e8ed] overflow-auto max-h-64 font-mono">
                  {JSON.stringify(queryResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === "rls" && (
          <div className="text-center py-12 text-[#9898a5] text-sm">
            <Shield size={32} className="mx-auto mb-3 opacity-30" />
            <p>RLS policy management coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
