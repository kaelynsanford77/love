import { useState } from 'react';
import { Sparkles, ArrowRight, Code2, Globe, Cpu, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Lovable Solo',
    subtitle: 'Your AI-powered IDE that builds apps from natural language',
  },
  {
    id: 'api-key',
    title: 'Connect your AI',
    subtitle: 'Add your API key to start building with AI assistance',
  },
  {
    id: 'first-project',
    title: 'Create your first project',
    subtitle: 'Start from a template or blank canvas',
  },
  {
    id: 'done',
    title: "You're all set!",
    subtitle: 'Lovable Solo is ready to help you build anything',
  },
];

const TEMPLATES = [
  { id: 'react-vite', name: 'React + Vite', icon: '⚛️', description: 'Modern React app with Vite' },
  { id: 'nextjs', name: 'Next.js', icon: '▲', description: 'Full-stack with SSR/SSG' },
  { id: 'landing', name: 'Landing Page', icon: '🚀', description: 'Beautiful marketing site' },
  { id: 'dashboard', name: 'Dashboard', icon: '📊', description: 'Admin panel with charts' },
  { id: 'blank', name: 'Blank', icon: '📄', description: 'Start from scratch' },
];

export default function OnboardingFlow() {
  const { hasSeenOnboarding, setHasSeenOnboarding, settings, updateSettings, addProject, setCurrentProjectId } = useStore();
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [selectedTemplate, setSelectedTemplate] = useState('react-vite');
  const [projectName, setProjectName] = useState('my-first-app');
  const [creating, setCreating] = useState(false);

  if (hasSeenOnboarding) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function handleNext() {
    if (step === 1 && apiKey) {
      updateSettings({ apiKey });
    }
    if (step === 2) {
      setCreating(true);
      try {
        const resp = await fetch(`${settings.orchestratorUrl}/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: projectName, template: selectedTemplate }),
        });
        if (resp.ok) {
          const project = await resp.json();
          addProject(project);
          setCurrentProjectId(project.id);
        }
      } catch {
        // Create a local project entry if server is not available
        const project = {
          id: crypto.randomUUID(),
          name: projectName,
          path: `workspaces/${projectName}`,
          template: selectedTemplate,
          createdAt: new Date().toISOString(),
        };
        addProject(project);
        setCurrentProjectId(project.id);
      } finally {
        setCreating(false);
      }
    }
    if (isLast) {
      setHasSeenOnboarding(true);
      toast.success('Welcome to Lovable Solo! 🎉');
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <div className="fixed inset-0 z-[300] bg-background flex items-center justify-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

      <div className="relative w-full max-w-[480px] mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Lovable Solo</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  'h-1 rounded-full transition-all',
                  i <= step ? 'bg-primary' : 'bg-muted',
                  i === step ? 'flex-[2]' : 'flex-1',
                )}
              />
            ))}
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">{currentStep.title}</h1>
          <p className="text-muted-foreground text-sm mb-6">{currentStep.subtitle}</p>

          {/* Step content */}
          {step === 0 && <WelcomeStep />}
          {step === 1 && (
            <ApiKeyStep apiKey={apiKey} setApiKey={setApiKey} />
          )}
          {step === 2 && (
            <ProjectStep
              projectName={projectName}
              setProjectName={setProjectName}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
            />
          )}
          {step === 3 && <DoneStep />}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 0 && !isLast ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleNext}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {creating ? (
                'Creating...'
              ) : isLast ? (
                <>
                  Start Building <Zap size={14} />
                </>
              ) : (
                <>
                  Continue <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={() => setHasSeenOnboarding(true)}
            className="block mx-auto mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}

function WelcomeStep() {
  const features = [
    { icon: <Cpu size={16} />, text: 'Smart AI routing: haiku → sonnet → opus' },
    { icon: <Code2 size={16} />, text: 'Full IDE with Monaco editor' },
    { icon: <Globe size={16} />, text: 'Live preview with hot reload' },
    { icon: <Zap size={16} />, text: 'One-click publish and deploy' },
  ];
  return (
    <div className="space-y-2.5">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border text-sm">
          <span className="text-primary">{f.icon}</span>
          <span className="text-foreground">{f.text}</span>
        </div>
      ))}
    </div>
  );
}

function ApiKeyStep({ apiKey, setApiKey }: { apiKey: string; setApiKey: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary">
        Get a free key at{' '}
        <a
          href="https://api.quatarly.cloud/api-key"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          api.quatarly.cloud/api-key
        </a>{' '}
        — works with Claude, GPT, and Gemini via one key.
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key..."
          className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        You can always change this in Settings. Your key is stored locally and never sent anywhere except the API endpoint.
      </p>
    </div>
  );
}

function ProjectStep({
  projectName,
  setProjectName,
  selectedTemplate,
  setSelectedTemplate,
}: {
  projectName: string;
  setProjectName: (v: string) => void;
  selectedTemplate: string;
  setSelectedTemplate: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Project name</label>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="my-awesome-app"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Template</label>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={cn(
                'flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all text-sm',
                selectedTemplate === t.id
                  ? 'bg-primary/10 border-primary text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80',
              )}
            >
              <span className="text-base leading-none mt-0.5">{t.icon}</span>
              <div>
                <p className="font-medium text-xs">{t.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DoneStep() {
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">🎉</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Your workspace is ready. Type a message in the chat to start building your project with AI assistance.
      </p>
    </div>
  );
}
