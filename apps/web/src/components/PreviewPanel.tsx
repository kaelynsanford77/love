import { useRef, useState } from 'react';
import { RotateCw, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Viewport } from '@/App';

interface PreviewPanelProps {
  src: string;
  viewport: Viewport;
  viewportSizes: Record<Viewport, { width: number | string; height: number | string }>;
  route: string;
  onRouteChange: (r: string) => void;
}

export default function PreviewPanel({ src, viewport, viewportSizes, route }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(false);
  const sizes = viewportSizes[viewport];

  const fullSrc = src === 'about:blank' ? 'about:blank' : `${src}${route}`;

  const reload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[oklch(0.13_0_0)] overflow-hidden h-full">
      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {src === 'about:blank' ? (
          <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <RotateCw size={24} className="text-muted-foreground" />
            </div>
            <div className="text-center">
              <div className="font-medium text-foreground">No preview yet</div>
              <div className="text-sm mt-1">Start chatting to build your app</div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'relative bg-white rounded-lg border border-border/50 shadow-2xl overflow-hidden transition-all duration-300',
            )}
            style={{
              width: typeof sizes.width === 'number' ? `${sizes.width}px` : sizes.width,
              height: typeof sizes.height === 'number' ? `${sizes.height}px` : sizes.height,
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          >
            {loading && (
              <div className="absolute inset-0 z-10 bg-card/80 flex items-center justify-center">
                <div className="skeleton w-full h-full" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={fullSrc}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
              onLoadStart={() => setLoading(true)}
              title="Preview"
            />
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-end gap-2 px-3 py-1.5 border-t border-border bg-card/50 text-xs text-muted-foreground">
        <button onClick={reload} className="hover:text-foreground transition-colors flex items-center gap-1">
          <RotateCw size={12} />
          Reload
        </button>
        <button
          onClick={() => window.open(fullSrc, '_blank')}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowUpRight size={12} />
          Open in new tab
        </button>
      </div>
    </div>
  );
}
