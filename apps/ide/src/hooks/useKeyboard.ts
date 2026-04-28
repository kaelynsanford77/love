import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export function useKeyboard() {
  const { setMode, commandPaletteOpen, setCommandPaletteOpen } = useStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // Cmd+K — command palette
      if (meta && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }

      // Cmd+1..5 — switch modes
      if (meta && e.key === '1') { e.preventDefault(); setMode('preview'); }
      if (meta && e.key === '2') { e.preventDefault(); setMode('code'); }
      if (meta && e.key === '3') { e.preventDefault(); setMode('cloud'); }
      if (meta && e.key === '4') { e.preventDefault(); setMode('analytics'); }

      // Esc — close palette
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setMode, commandPaletteOpen, setCommandPaletteOpen]);
}
