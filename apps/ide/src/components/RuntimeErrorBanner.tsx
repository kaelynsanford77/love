import React from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Wrench } from 'lucide-react';

export function RuntimeErrorBanner() {
  const { errors, clearErrors, addMessage, setMode } = useStore();

  if (errors.length === 0) return null;

  const latest = errors[errors.length - 1];

  const fixThis = () => {
    const text = `Fix this runtime error:\n\n${latest.message}\n\nStack trace:\n${latest.stack}`;
    addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });
    setMode('preview');
    clearErrors();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border-b border-destructive/30 text-destructive text-xs shrink-0">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate font-mono">{latest.message}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs text-destructive hover:text-destructive gap-1"
        onClick={fixThis}
      >
        <Wrench className="h-3 w-3" />
        Fix this
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={clearErrors}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
