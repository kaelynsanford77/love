import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Eye, Code2, Cloud, BarChart2, Settings, Share2, Package, Terminal } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setMode } = useStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { id: 'preview', label: 'Switch to Preview', category: 'Navigation', icon: <Eye className="h-3.5 w-3.5" />, action: () => { setMode('preview'); setCommandPaletteOpen(false); } },
    { id: 'code', label: 'Switch to Code', category: 'Navigation', icon: <Code2 className="h-3.5 w-3.5" />, action: () => { setMode('code'); setCommandPaletteOpen(false); } },
    { id: 'cloud', label: 'Switch to Cloud', category: 'Navigation', icon: <Cloud className="h-3.5 w-3.5" />, action: () => { setMode('cloud'); setCommandPaletteOpen(false); } },
    { id: 'analytics', label: 'Switch to Analytics', category: 'Navigation', icon: <BarChart2 className="h-3.5 w-3.5" />, action: () => { setMode('analytics'); setCommandPaletteOpen(false); } },
    { id: 'share', label: 'Share Preview', category: 'Tools', icon: <Share2 className="h-3.5 w-3.5" />, action: () => setCommandPaletteOpen(false) },
    { id: 'packages', label: 'Package Manager', category: 'Tools', icon: <Package className="h-3.5 w-3.5" />, action: () => setCommandPaletteOpen(false) },
    { id: 'terminal', label: 'Open Terminal', category: 'Tools', icon: <Terminal className="h-3.5 w-3.5" />, action: () => { setMode('code'); setCommandPaletteOpen(false); } },
    { id: 'settings', label: 'Settings', category: 'App', icon: <Settings className="h-3.5 w-3.5" />, action: () => setCommandPaletteOpen(false) },
  ];

  const filtered = query.trim()
    ? commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.keywords?.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const categories = [...new Set(filtered.map((c) => c.category))];

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [commandPaletteOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); filtered[selected]?.action(); }
    if (e.key === 'Escape') { setCommandPaletteOpen(false); }
  };

  let globalIdx = 0;

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands…"
            className="border-0 p-0 h-8 text-sm focus-visible:ring-0 bg-transparent"
          />
          <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">esc</kbd>
        </div>
        <ScrollArea className="max-h-80">
          {categories.map((cat) => (
            <div key={cat}>
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">{cat}</div>
              {filtered.filter((c) => c.category === cat).map((cmd) => {
                const idx = globalIdx++;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                      selected === idx ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                    }`}
                    onMouseEnter={() => setSelected(idx)}
                  >
                    <span className="text-muted-foreground">{cmd.icon}</span>
                    {cmd.label}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">No commands found</div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
