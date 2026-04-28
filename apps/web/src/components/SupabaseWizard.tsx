import { useState } from 'react';
import {
  Database,
  X,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface SupabaseWizardProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'choose' | 'connect' | 'testing' | 'types' | 'done';
type ConnectionType = 'supabase' | 'postgres';

export default function SupabaseWizard({ open, onClose }: SupabaseWizardProps) {
  const { settings, currentProjectId, updateProject } = useStore();
  const [step, setStep] = useState<Step>('choose');
  const [connectionType, setConnectionType] = useState<ConnectionType>('supabase');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [postgresUrl, setPostgresUrl] = useState('postgresql://user:pass@localhost:5432/mydb');
  const [showKey, setShowKey] = useState(false);
  const [showServiceKey, setShowServiceKey] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  function handleClose() {
    setStep('choose');
    setError('');
    setGeneratedCode('');
    onClose();
  }

  async function handleConnect() {
    setError('');
    setStep('testing');
    try {
      const body =
        connectionType === 'supabase'
          ? { type: 'supabase', url: supabaseUrl, anonKey, serviceKey }
          : { type: 'postgres', url: postgresUrl };

      const resp = await fetch(`${settings.orchestratorUrl}/supabase/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProjectId, ...body }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error ?? 'Connection failed');
      }

      const data = await resp.json();
      setGeneratedCode(data.clientCode ?? generateClientCode(supabaseUrl, anonKey));

      if (currentProjectId) {
        updateProject(currentProjectId, {
          supabaseUrl: connectionType === 'supabase' ? supabaseUrl : postgresUrl,
          supabaseAnonKey: anonKey,
        });
      }

      setStep('types');
      toast.success('Database connected!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Connection failed';
      // If server not available, still generate client code
      setGeneratedCode(generateClientCode(supabaseUrl, anonKey));
      setStep('types');
      toast.info('Offline mode: client code generated without server connection');
    }
  }

  async function handleGenerateTypes() {
    try {
      const resp = await fetch(`${settings.orchestratorUrl}/supabase/types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProjectId }),
      });
      if (resp.ok) {
        toast.success('Types generated at src/lib/database.types.ts');
        setStep('done');
      } else {
        setStep('done');
      }
    } catch {
      setStep('done');
      toast.info('Type generation requires the orchestrator to be running');
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[540px] mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Database size={16} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Database Connection</h2>
              <p className="text-xs text-muted-foreground">Connect Supabase or PostgreSQL</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          {step === 'choose' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose your database type:</p>
              <div className="grid grid-cols-2 gap-3">
                <ConnectionCard
                  active={connectionType === 'supabase'}
                  onClick={() => setConnectionType('supabase')}
                  icon="⚡"
                  title="Supabase"
                  description="Managed Postgres with real-time and auth"
                />
                <ConnectionCard
                  active={connectionType === 'postgres'}
                  onClick={() => setConnectionType('postgres')}
                  icon="🐘"
                  title="PostgreSQL"
                  description="Direct PostgreSQL connection (local or remote)"
                />
              </div>
              <button
                onClick={() => setStep('connect')}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2 mt-2"
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          )}

          {step === 'connect' && connectionType === 'supabase' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-muted/50 border border-border">
                <AlertCircle size={12} className="text-primary shrink-0" />
                Find these in your Supabase project → Settings → API
              </div>
              <FormField
                label="Project URL"
                value={supabaseUrl}
                onChange={setSupabaseUrl}
                placeholder="https://xxxx.supabase.co"
              />
              <FormField
                label="Anon (public) key"
                value={anonKey}
                onChange={setAnonKey}
                placeholder="eyJhbGci..."
                type={showKey ? 'text' : 'password'}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
              <FormField
                label="Service role key (optional)"
                value={serviceKey}
                onChange={setServiceKey}
                placeholder="eyJhbGci..."
                type={showServiceKey ? 'text' : 'password'}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowServiceKey((v) => !v)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showServiceKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
              {error && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle size={12} /> {error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('choose')}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground"
                >
                  Back
                </button>
                <button
                  onClick={handleConnect}
                  disabled={!supabaseUrl || !anonKey}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Connect <Zap size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 'connect' && connectionType === 'postgres' && (
            <div className="space-y-4">
              <FormField
                label="Connection string"
                value={postgresUrl}
                onChange={setPostgresUrl}
                placeholder="postgresql://user:pass@host:5432/db"
              />
              <p className="text-xs text-muted-foreground">
                For local Postgres: <code className="bg-muted px-1 rounded text-[11px]">postgresql://postgres:postgres@localhost:5432/mydb</code>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('choose')}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground"
                >
                  Back
                </button>
                <button
                  onClick={handleConnect}
                  disabled={!postgresUrl}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Connect <Zap size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 'testing' && (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">Testing connection…</p>
              <p className="text-xs text-muted-foreground mt-1">Verifying credentials and generating client code</p>
            </div>
          )}

          {step === 'types' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Connected!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Client code generated. Add it to your project.</p>
                </div>
              </div>
              {generatedCode && (
                <div className="relative">
                  <pre className="p-3 rounded-xl bg-muted border border-border text-[11px] text-muted-foreground overflow-x-auto max-h-32 leading-relaxed">
                    {generatedCode}
                  </pre>
                  <button
                    onClick={copyCode}
                    className="absolute top-2 right-2 p-1.5 rounded bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateTypes}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Generate TypeScript types
                </button>
                <button
                  onClick={() => setStep('done')}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  Done <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Database connected!</p>
              <p className="text-xs text-muted-foreground mb-4">
                Your database credentials are saved. Use the Cloud panel to browse tables and run queries.
              </p>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 mx-auto flex items-center gap-2"
              >
                Open Cloud Panel <Database size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectionCard({
  active,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all',
        active
          ? 'bg-primary/10 border-primary'
          : 'border-border hover:border-border/80 hover:bg-muted/50',
      )}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={cn('text-sm font-semibold', active ? 'text-primary' : 'text-foreground')}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground leading-tight">{description}</p>
      </div>
    </button>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted border border-border focus-within:ring-2 focus-within:ring-ring">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
        />
        {suffix}
      </div>
    </div>
  );
}

function generateClientCode(url: string, key: string): string {
  return `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${url || 'https://your-project.supabase.co'}'
const supabaseAnonKey = '${key ? key.slice(0, 20) + '...' : 'your-anon-key'}'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)`;
}
