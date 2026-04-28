import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';
import { Zap, Key, FolderOpen, CheckCircle2 } from 'lucide-react';

const steps = ['welcome', 'api-key', 'first-project', 'done'] as const;
type Step = typeof steps[number];

export function OnboardingWizard() {
  const { onboardingComplete, setOnboardingComplete, settings, updateSettings } = useStore();
  const [step, setStep] = useState<Step>('welcome');
  const [apiKey, setApiKey] = useState(settings?.apiKey ?? '');
  const [projectName, setProjectName] = useState('my-first-project');

  if (onboardingComplete) return null;

  const next = () => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const finish = () => {
    if (apiKey) updateSettings({ apiKey });
    setOnboardingComplete(true);
  };

  return (
    <Dialog open={!onboardingComplete} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        {step === 'welcome' && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome to Lovable Solo</h2>
              <p className="text-sm text-muted-foreground mt-1">Your AI-powered IDE — build apps by chatting</p>
            </div>
            <Button onClick={next} className="w-full mt-2">Get Started →</Button>
          </div>
        )}

        {step === 'api-key' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Add your API key</h3>
                <p className="text-xs text-muted-foreground">Get yours at <a href="https://api.quatarly.cloud/api-key" target="_blank" rel="noreferrer" className="text-primary underline">api.quatarly.cloud/api-key</a></p>
              </div>
            </div>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={next} className="flex-1">Skip for now</Button>
              <Button onClick={() => { if (apiKey) updateSettings({ apiKey }); next(); }} className="flex-1">Next →</Button>
            </div>
          </div>
        )}

        {step === 'first-project' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Name your first project</h3>
                <p className="text-xs text-muted-foreground">You can always create more later</p>
              </div>
            </div>
            <Input
              placeholder="my-first-project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <Button onClick={next} className="w-full">Next →</Button>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div>
              <h2 className="text-xl font-bold">You're all set!</h2>
              <p className="text-sm text-muted-foreground mt-1">Start chatting with AI to build your app</p>
            </div>
            <Button onClick={finish} className="w-full">Let's build! 🚀</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
