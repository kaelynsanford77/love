import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';
import { Settings, Palette, Brain, Shield, Info } from 'lucide-react';

type Section = 'general' | 'appearance' | 'ai' | 'privacy' | 'about';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [section, setSection] = useState<Section>('general');
  const { settings, updateSettings } = useStore();

  const nav = [
    { id: 'general' as Section, label: 'General', icon: <Settings className="h-3.5 w-3.5" /> },
    { id: 'appearance' as Section, label: 'Appearance', icon: <Palette className="h-3.5 w-3.5" /> },
    { id: 'ai' as Section, label: 'AI / LLM', icon: <Brain className="h-3.5 w-3.5" /> },
    { id: 'privacy' as Section, label: 'Privacy', icon: <Shield className="h-3.5 w-3.5" /> },
    { id: 'about' as Section, label: 'About', icon: <Info className="h-3.5 w-3.5" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex h-[500px]">
          {/* Sidebar */}
          <div className="w-40 border-r border-border p-2 space-y-0.5 shrink-0">
            {nav.map((n) => (
              <button
                key={n.id}
                onClick={() => setSection(n.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                  section === n.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 text-muted-foreground'
                }`}
              >
                {n.icon}
                {n.label}
              </button>
            ))}
          </div>
          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            {section === 'general' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">General</h3>
                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">Auto-save</div>
                    <div className="text-xs text-muted-foreground">Save files automatically</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings?.autoSave ?? true}
                    onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                    className="h-4 w-4"
                  />
                </label>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Orchestrator URL</label>
                  <Input
                    value={settings?.orchestratorUrl ?? 'http://localhost:4000'}
                    onChange={(e) => updateSettings({ orchestratorUrl: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
            {section === 'appearance' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Appearance</h3>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Theme</label>
                  <select
                    value={settings?.theme ?? 'dark'}
                    onChange={(e) => updateSettings({ theme: e.target.value as 'dark' | 'light' })}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Font size</label>
                  <Input
                    type="number"
                    value={settings?.fontSize ?? 14}
                    onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                    className="w-24 text-sm"
                    min={10}
                    max={24}
                  />
                </div>
              </div>
            )}
            {section === 'ai' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">AI / LLM</h3>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">API Key</label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={settings?.apiKey ?? ''}
                    onChange={(e) => updateSettings({ apiKey: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Base URL</label>
                  <Input
                    value={settings?.baseUrl ?? 'https://api.quatarly.cloud/v1'}
                    onChange={(e) => updateSettings({ baseUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Routing mode</label>
                  <select
                    value={settings?.routingMode ?? 'auto'}
                    onChange={(e) => updateSettings({ routingMode: e.target.value as 'auto' | 'fixed' })}
                    className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  >
                    <option value="auto">Auto</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fast model</label>
                  <Input value={settings?.modelFast ?? 'claude-haiku-4-5-20251001'} onChange={(e) => updateSettings({ modelFast: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Standard model</label>
                  <Input value={settings?.modelStandard ?? 'claude-sonnet-4-6-thinking'} onChange={(e) => updateSettings({ modelStandard: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Powerful model</label>
                  <Input value={settings?.modelPowerful ?? 'claude-opus-4-6-thinking'} onChange={(e) => updateSettings({ modelPowerful: e.target.value })} />
                </div>
              </div>
            )}
            {section === 'privacy' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Privacy</h3>
                <label className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">Telemetry</div>
                    <div className="text-xs text-muted-foreground">Send anonymous usage data</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings?.telemetry ?? false}
                    onChange={(e) => updateSettings({ telemetry: e.target.checked })}
                    className="h-4 w-4"
                  />
                </label>
              </div>
            )}
            {section === 'about' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">About</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><span className="text-foreground font-medium">Lovable Solo</span> v1.0.0</p>
                  <p>AI-powered IDE for building web apps by chatting</p>
                  <p>Powered by <a href="https://api.quatarly.cloud" target="_blank" rel="noreferrer" className="text-primary underline">Quatarly</a></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
