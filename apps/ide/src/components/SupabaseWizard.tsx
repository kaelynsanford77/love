import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Database, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';

type WizardStep = 'choose' | 'existing' | 'local';

export function SupabaseWizard() {
  const [step, setStep] = useState<WizardStep>('choose');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [localUrl, setLocalUrl] = useState('postgresql://postgres:postgres@localhost:5432/postgres');
  const [testing, setTesting] = useState(false);
  const { setSupabaseConnected, setSupabaseConfig } = useStore();

  const testAndConnect = async () => {
    setTesting(true);
    try {
      const payload = step === 'existing'
        ? { url: supabaseUrl, anonKey, serviceKey }
        : { url: localUrl, anonKey: '', serviceKey: '' };
      await api.post('/supabase/connect', payload);
      setSupabaseConnected(true);
      setSupabaseConfig({ url: step === 'existing' ? supabaseUrl : localUrl, anonKey });
      toast.success('Connected to database!');
    } catch {
      toast.error('Connection failed — check your credentials');
    } finally {
      setTesting(false);
    }
  };

  if (step === 'choose') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
        <div className="text-center">
          <Database className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <h3 className="font-semibold text-base mb-1">Connect a Database</h3>
          <p className="text-sm text-muted-foreground">Choose how you want to connect</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button variant="outline" className="h-12 justify-start gap-3" onClick={() => setStep('existing')}>
            <Database className="h-4 w-4 text-primary" />
            <div className="text-left">
              <div className="text-sm font-medium">Connect existing Supabase</div>
              <div className="text-xs text-muted-foreground">URL + anon key + service role key</div>
            </div>
          </Button>
          <Button variant="outline" className="h-12 justify-start gap-3" onClick={() => setStep('local')}>
            <Database className="h-4 w-4 text-green-500" />
            <div className="text-left">
              <div className="text-sm font-medium">Local PostgreSQL</div>
              <div className="text-xs text-muted-foreground">Connect with a connection string</div>
            </div>
          </Button>
          <Button variant="outline" className="h-12 justify-start gap-3" asChild>
            <a href="https://supabase.com" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 text-green-500" />
              <div className="text-left">
                <div className="text-sm font-medium">Create new Supabase project</div>
                <div className="text-xs text-muted-foreground">Opens supabase.com</div>
              </div>
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'local') {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" className="text-xs mb-2" onClick={() => setStep('choose')}>← Back</Button>
        <h3 className="font-semibold text-sm">Local PostgreSQL</h3>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Connection String</label>
          <Input
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            placeholder="postgresql://user:pass@localhost:5432/db"
            className="font-mono text-xs"
          />
        </div>
        <Button onClick={testAndConnect} disabled={testing} className="w-full">
          {testing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
          Test & Connect
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Button variant="ghost" size="sm" className="text-xs mb-2" onClick={() => setStep('choose')}>← Back</Button>
      <h3 className="font-semibold text-sm">Connect Supabase</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Project URL</label>
          <Input value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} placeholder="https://xxx.supabase.co" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Anon Key</label>
          <Input value={anonKey} onChange={(e) => setAnonKey(e.target.value)} placeholder="eyJh..." type="password" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Service Role Key</label>
          <Input value={serviceKey} onChange={(e) => setServiceKey(e.target.value)} placeholder="eyJh..." type="password" />
        </div>
      </div>
      <Button onClick={testAndConnect} disabled={testing || !supabaseUrl || !anonKey} className="w-full">
        {testing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
        Test & Connect
      </Button>
    </div>
  );
}
