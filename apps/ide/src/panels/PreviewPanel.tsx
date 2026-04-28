import React, { useRef, useEffect } from 'react';
import { useStore, type Viewport } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const ORCHESTRATOR_URL =
  (import.meta.env.VITE_ORCHESTRATOR_URL as string | undefined) ?? 'http://localhost:4000';

const viewportStyles: Record<Viewport, React.CSSProperties> = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: '768px', height: '100%', maxHeight: '100%' },
  mobile: { width: '390px', height: '844px', maxHeight: '100%' },
  fullscreen: { width: '100%', height: '100%' },
};

export function PreviewPanel() {
  const { projectId, route, viewport } = useStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = React.useState(true);

  const src = `${ORCHESTRATOR_URL}/preview/${encodeURIComponent(projectId)}${route}`;

  useEffect(() => {
    setLoading(true);
  }, [src]);

  const isConstrained = viewport === 'tablet' || viewport === 'mobile';

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center',
        isConstrained ? 'justify-center bg-muted/20 overflow-auto p-4' : 'bg-white'
      )}
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading preview…</p>
          </div>
        </div>
      )}

      <div
        style={{
          ...viewportStyles[viewport],
          boxShadow: isConstrained ? '0 0 0 1px hsl(var(--border)), 0 20px 60px rgba(0,0,0,0.4)' : 'none',
          borderRadius: isConstrained ? '8px' : '0',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <iframe
          ref={iframeRef}
          src={src}
          title="Preview"
          className="preview-frame"
          style={{ width: '100%', height: '100%', border: 'none' }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          onLoad={() => setLoading(false)}
        />
      </div>

      {/* Mobile device chrome */}
      {viewport === 'mobile' && (
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center">
          <div
            style={{
              width: '410px',
              height: '884px',
              border: '2px solid hsl(var(--border))',
              borderRadius: '44px',
              position: 'absolute',
              boxShadow: 'inset 0 0 0 2px hsl(var(--muted))',
            }}
          />
        </div>
      )}
    </div>
  );
}
