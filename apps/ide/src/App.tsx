import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Toolbar } from './toolbar/Toolbar';
import { ChatPanel } from './panels/ChatPanel';
import { PreviewPanel } from './panels/PreviewPanel';
import { CodePanel } from './panels/CodePanel';
import { CloudPanel } from './panels/CloudPanel';
import { AnalyticsPanel } from './panels/AnalyticsPanel';
import { useStore } from './lib/store';
import { TooltipProvider } from './components/ui/tooltip';
import { MobileBottomNav } from './components/mobile/MobileBottomNav';
import { CommandPalette } from './components/CommandPalette';
import { OnboardingWizard } from './components/OnboardingWizard';
import { useKeyboard } from './hooks/useKeyboard';

function MainPanel() {
  const { mode } = useStore();
  switch (mode) {
    case 'preview': return <PreviewPanel />;
    case 'files':
    case 'code':   return <CodePanel />;
    case 'cloud':  return <CloudPanel />;
    case 'analytics': return <AnalyticsPanel />;
    default:       return <PreviewPanel />;
  }
}

function AppInner() {
  const { splitView, addError } = useStore();
  useKeyboard();

  // Resizable left panel
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(380);
  const dragging = useRef(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Listen for runtime errors from preview iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'lovable:error') {
        addError({
          message: e.data.message ?? 'Unknown error',
          stack: e.data.stack ?? '',
          url: e.data.url,
          line: e.data.line,
          col: e.data.col,
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [addError]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newW = Math.max(280, Math.min(ev.clientX - rect.left, 600));
      setLeftWidth(newW);
    };

    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-background ${isMobile ? 'pb-14' : ''}`}>
      <Toolbar />

      <div ref={containerRef} className="flex flex-1 min-h-0">
        {/* Left panel: Chat (hidden on mobile) */}
        {!isMobile && (
          <>
            <div
              className="flex flex-col border-r border-border shrink-0 overflow-hidden"
              style={{ width: leftWidth }}
            >
              <ChatPanel />
            </div>
            {/* Drag handle */}
            <div
              className="resize-handle"
              onMouseDown={onMouseDown}
              style={{ width: 4, cursor: 'col-resize', flexShrink: 0 }}
            />
          </>
        )}

        {/* Right panel(s) */}
        {splitView && !isMobile ? (
          <div className="flex flex-1 min-w-0">
            <div className="flex-1 min-w-0 border-r border-border">
              <MainPanel />
            </div>
            <div className="flex-1 min-w-0">
              <CodePanel />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <MainPanel />
          </div>
        )}
      </div>

      {isMobile && <MobileBottomNav />}
      <CommandPalette />
      <OnboardingWizard />
    </div>
  );
}

export default function App() {
  return (
    <TooltipProvider delayDuration={400}>
      <AppInner />
    </TooltipProvider>
  );
}
