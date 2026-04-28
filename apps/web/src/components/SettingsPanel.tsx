import { useState } from 'react';
import {
  X,
  Settings,
  Palette,
  Cpu,
  Bell,
  Shield,
  Info,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useStore, type AppSettings } from '@/store/useStore';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'general', label: 'General', icon: <Settings size={15} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
  { id: 'llm', label: 'AI / LLM', icon: <Cpu size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'privacy', label: 'Privacy', icon: <Shield size={15} /> },
  { id: 'about', label: 'About', icon: <Info size={15} /> },
];

export default function SettingsPanel() {
  const { settingsOpen, setSettingsOpen, settings, updateSettings } = useStore();
  const [activeSection, setActiveSection] = useState('general');

  if (!settingsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setSettingsOpen(false)}
    >
      <div
        className="w-full max-w-[780px] mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex h-[520px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-[200px] bg-muted/40 border-r border-border p-2 shrink-0">
          <div className="flex items-center justify-between px-2 py-2 mb-2">
            <span className="font-semibold text-sm text-foreground">Settings</span>
            <button
              onClick={() => setSettingsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left',
                activeSection === s.id
                  ? 'bg-primary/15 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/20',
              )}
            >
              {s.icon}
              {s.label}
              {activeSection === s.id && (
                <ChevronRight size={12} className="ml-auto text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'general' && (
            <GeneralSection settings={settings} updateSettings={updateSettings} />
          )}
          {activeSection === 'appearance' && (
            <AppearanceSection settings={settings} updateSettings={updateSettings} />
          )}
          {activeSection === 'llm' && (
            <LLMSection settings={settings} updateSettings={updateSettings} />
          )}
          {activeSection === 'notifications' && <NotificationsSection />}
          {activeSection === 'privacy' && (
            <PrivacySection settings={settings} updateSettings={updateSettings} />
          )}
          {activeSection === 'about' && <AboutSection />}
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
        value ? 'bg-primary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 translate-x-0 rounded-full bg-white shadow-lg ring-0 transition-transform',
          value ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-base font-semibold text-foreground mb-4">{title}</h2>;
}

function GeneralSection({
  settings,
  updateSettings,
}: {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}) {
  return (
    <div>
      <SectionTitle title="General" />
      <SettingRow label="Auto-save" description="Automatically save files as you type">
        <Toggle value={settings.autoSave} onChange={(v) => updateSettings({ autoSave: v })} />
      </SettingRow>
      <SettingRow label="Orchestrator URL" description="Backend API server address">
        <input
          value={settings.orchestratorUrl}
          onChange={(e) => updateSettings({ orchestratorUrl: e.target.value })}
          className="w-52 px-2 py-1 rounded bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </SettingRow>
    </div>
  );
}

function AppearanceSection({
  settings,
  updateSettings,
}: {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}) {
  return (
    <div>
      <SectionTitle title="Appearance" />
      <SettingRow label="Theme" description="Interface color scheme">
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateSettings({ theme: t })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm border transition-colors capitalize',
                settings.theme === t
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {settings.theme === t && <Check size={12} className="inline mr-1" />}
              {t}
            </button>
          ))}
        </div>
      </SettingRow>
      <SettingRow label="Code font size" description="Size of text in the code editor">
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateSettings({ fontSize: Math.max(10, settings.fontSize - 1) })}
            className="w-7 h-7 rounded bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center text-sm"
          >
            −
          </button>
          <span className="text-sm w-6 text-center text-foreground">{settings.fontSize}</span>
          <button
            onClick={() => updateSettings({ fontSize: Math.min(24, settings.fontSize + 1) })}
            className="w-7 h-7 rounded bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center text-sm"
          >
            +
          </button>
        </div>
      </SettingRow>
    </div>
  );
}

function LLMSection({
  settings,
  updateSettings,
}: {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}) {
  return (
    <div>
      <SectionTitle title="AI / LLM Configuration" />
      <SettingRow label="API Key" description="Your Quatarly or OpenAI API key">
        <input
          type="password"
          value={settings.apiKey}
          onChange={(e) => updateSettings({ apiKey: e.target.value })}
          placeholder="sk-..."
          className="w-52 px-2 py-1 rounded bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </SettingRow>
      <SettingRow label="API Base URL" description="OpenAI-compatible API endpoint">
        <input
          value={settings.apiBaseUrl}
          onChange={(e) => updateSettings({ apiBaseUrl: e.target.value })}
          className="w-52 px-2 py-1 rounded bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </SettingRow>
      <SettingRow label="Model routing" description="How to select models automatically">
        <div className="flex gap-2">
          {(['auto', 'fixed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSettings({ llmRouting: mode })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm border transition-colors capitalize',
                settings.llmRouting === mode
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {settings.llmRouting === mode && <Check size={12} className="inline mr-1" />}
              {mode}
            </button>
          ))}
        </div>
      </SettingRow>
      <SettingRow label="Fast model" description="Used for simple tasks">
        <input
          value={settings.llmModelFast}
          onChange={(e) => updateSettings({ llmModelFast: e.target.value })}
          className="w-52 px-2 py-1 rounded bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </SettingRow>
      <SettingRow label="Standard model" description="Used for most tasks">
        <input
          value={settings.llmModelStandard}
          onChange={(e) => updateSettings({ llmModelStandard: e.target.value })}
          className="w-52 px-2 py-1 rounded bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </SettingRow>
      <SettingRow label="Powerful model" description="Used for complex tasks">
        <input
          value={settings.llmModelPowerful}
          onChange={(e) => updateSettings({ llmModelPowerful: e.target.value })}
          className="w-52 px-2 py-1 rounded bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </SettingRow>
    </div>
  );
}

function NotificationsSection() {
  return (
    <div>
      <SectionTitle title="Notifications" />
      <p className="text-sm text-muted-foreground">Notification preferences coming soon.</p>
    </div>
  );
}

function PrivacySection({
  settings,
  updateSettings,
}: {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}) {
  return (
    <div>
      <SectionTitle title="Privacy" />
      <SettingRow
        label="Usage telemetry"
        description="Help improve Lovable by sharing anonymous usage data"
      >
        <Toggle
          value={settings.telemetryEnabled}
          onChange={(v) => updateSettings({ telemetryEnabled: v })}
        />
      </SettingRow>
    </div>
  );
}

function AboutSection() {
  return (
    <div>
      <SectionTitle title="About" />
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
            L
          </div>
          <div>
            <p className="font-semibold text-foreground">Lovable Solo</p>
            <p className="text-muted-foreground text-xs">AI-Powered IDE · v1.0.0</p>
          </div>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          A self-hosted, full-featured AI IDE inspired by Lovable. Built with React, Vite,
          TypeScript, and powered by your choice of LLM (Claude, GPT, Gemini via Quatarly).
        </p>
        <div className="flex gap-2">
          <a
            href="https://github.com/kaelynsanford77/love"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub Repository
          </a>
          <a
            href="https://api.quatarly.cloud/api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Get API Key
          </a>
        </div>
      </div>
    </div>
  );
}
