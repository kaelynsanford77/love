import { useEffect } from 'react';

type KeyCombo = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
};

type ShortcutHandler = () => void;

export function useKeyboard(
  shortcuts: Array<{ combo: KeyCombo; handler: ShortcutHandler; description?: string }>,
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const { combo, handler } of shortcuts) {
        const metaOk = combo.meta ? (e.metaKey || e.ctrlKey) : !combo.meta;
        const ctrlOk = combo.ctrl ? e.ctrlKey : true;
        const shiftOk = combo.shift ? e.shiftKey : true;
        const altOk = combo.alt ? e.altKey : true;
        const keyOk = e.key.toLowerCase() === combo.key.toLowerCase();

        if (keyOk && metaOk && ctrlOk && shiftOk && altOk) {
          // Don't fire if focused in a textarea/input (unless meta is required)
          const target = e.target as HTMLElement;
          const inInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable;
          if (inInput && !combo.meta) continue;

          e.preventDefault();
          handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
