import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Loader2, Layers } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';

const SHADCN_COMPONENTS = [
  { name: 'accordion', description: 'Vertically stacked collapsible sections', category: 'Layout' },
  { name: 'alert', description: 'Displays important messages', category: 'Feedback' },
  { name: 'alert-dialog', description: 'Modal dialog for important actions', category: 'Overlay' },
  { name: 'avatar', description: 'User profile picture or initials', category: 'Display' },
  { name: 'badge', description: 'Small count or label', category: 'Display' },
  { name: 'button', description: 'Trigger an action or event', category: 'Form' },
  { name: 'card', description: 'Container for grouped content', category: 'Layout' },
  { name: 'checkbox', description: 'Toggle between checked states', category: 'Form' },
  { name: 'command', description: 'Fast keyboard-first command menu', category: 'Navigation' },
  { name: 'dialog', description: 'Modal window overlay', category: 'Overlay' },
  { name: 'dropdown-menu', description: 'Menu that appears from a trigger', category: 'Navigation' },
  { name: 'form', description: 'Form with validation', category: 'Form' },
  { name: 'input', description: 'Text input field', category: 'Form' },
  { name: 'label', description: 'Accessible form label', category: 'Form' },
  { name: 'popover', description: 'Floating content panel', category: 'Overlay' },
  { name: 'progress', description: 'Shows progress of a task', category: 'Feedback' },
  { name: 'scroll-area', description: 'Custom scrollable container', category: 'Layout' },
  { name: 'select', description: 'Dropdown selection', category: 'Form' },
  { name: 'separator', description: 'Visual divider', category: 'Layout' },
  { name: 'sheet', description: 'Slide-in panel', category: 'Overlay' },
  { name: 'skeleton', description: 'Loading placeholder', category: 'Feedback' },
  { name: 'slider', description: 'Range value selector', category: 'Form' },
  { name: 'switch', description: 'Toggle on/off', category: 'Form' },
  { name: 'table', description: 'Tabular data display', category: 'Display' },
  { name: 'tabs', description: 'Tabbed content sections', category: 'Navigation' },
  { name: 'textarea', description: 'Multi-line text input', category: 'Form' },
  { name: 'toast', description: 'Notifications', category: 'Feedback' },
  { name: 'tooltip', description: 'Informational popup on hover', category: 'Display' },
];

interface ComponentBrowserProps {
  open: boolean;
  onClose: () => void;
}

export function ComponentBrowser({ open, onClose }: ComponentBrowserProps) {
  const { projectId } = useStore();
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  const filtered = search
    ? SHADCN_COMPONENTS.filter((c) =>
        c.name.includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
      )
    : SHADCN_COMPONENTS;

  const categories = [...new Set(filtered.map((c) => c.category))];

  const addComponent = async (name: string) => {
    setAdding(name);
    try {
      await api.post('/exec', { projectId, command: `bunx shadcn@latest add ${name} --yes` });
      toast.success(`Added ${name} component`);
    } catch {
      toast.error(`Failed to add ${name}`);
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            shadcn Component Browser
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components…"
            className="pl-8"
          />
        </div>
        <ScrollArea className="h-96">
          {categories.map((cat) => (
            <div key={cat} className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 px-1">{cat}</h4>
              <div className="grid grid-cols-2 gap-2">
                {filtered.filter((c) => c.category === cat).map((comp) => (
                  <div key={comp.name} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{comp.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{comp.description}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      onClick={() => addComponent(comp.name)}
                      disabled={adding === comp.name}
                    >
                      {adding === comp.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
