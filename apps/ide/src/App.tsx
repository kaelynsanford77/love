import React, { useRef, useState, useCallback } from 'react';
import { Toolbar } from './toolbar/Toolbar';
import { ChatPanel } from './panels/ChatPanel';
import { PreviewPanel } from './panels/PreviewPanel';
import { CodePanel } from './panels/CodePanel';
import { CloudPanel } from './panels/CloudPanel';
import { AnalyticsPanel } from './panels/AnalyticsPanel';
import { useStore } from './lib/store';
import { TooltipProvider } from './components/ui/tooltip';

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

export default function App() {
  const { splitView } = useStore();

  // Resizable left panel
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(380);
  const dragging = useRef(false);

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
    <TooltipProvider delayDuration={400}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        <Toolbar />

        <div ref={containerRef} className="flex flex-1 min-h-0">
          {/* Left panel: Chat */}
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

          {/* Right panel(s) */}
          {splitView ? (
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
      </div>
    </TooltipProvider>
  );
}
