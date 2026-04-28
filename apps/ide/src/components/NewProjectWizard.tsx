import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Zap, Triangle, Layers, Wind, Globe, LayoutDashboard, Server, FileCode } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';

const templates = [
  { id: 'react-vite', label: 'React + Vite', icon: <Zap className="h-5 w-5 text-yellow-500" /> },
  { id: 'nextjs', label: 'Next.js', icon: <Triangle className="h-5 w-5" /> },
  { id: 'vue3', label: 'Vue 3', icon: <Layers className="h-5 w-5 text-green-500" /> },
  { id: 'sveltekit', label: 'SvelteKit', icon: <Wind className="h-5 w-5 text-orange-500" /> },
  { id: 'landing-page', label: 'Landing Page', icon: <Globe className="h-5 w-5 text-blue-500" /> },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5 text-purple-500" /> },
  { id: 'express-api', label: 'Express API', icon: <Server className="h-5 w-5 text-green-600" /> },
  { id: 'blank', label: 'Blank', icon: <FileCode className="h-5 w-5 text-muted-foreground" /> },
];

interface NewProjectWizardProps {
  open: boolean;
  onClose: () => void;
}

export function NewProjectWizard({ open, onClose }: NewProjectWizardProps) {
  const [template, setTemplate] = useState('react-vite');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const { setProjectId } = useStore();

  const create = async () => {
    if (!name.trim()) { toast.error('Enter a project name'); return; }
    setCreating(true);
    try {
      const result = await api.post<{ id: string; name: string }>('/projects', { name: name.trim(), template });
      setProjectId(result.id);
      toast.success(`Created ${result.name}`);
      onClose();
    } catch {
      toast.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Choose a template</label>
            <div className="grid grid-cols-4 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                    template === t.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {t.icon}
                  <span className="text-xs leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Project name</label>
            <Input
              placeholder="my-awesome-app"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={create} disabled={creating || !name.trim()}>
              {creating && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Create Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
