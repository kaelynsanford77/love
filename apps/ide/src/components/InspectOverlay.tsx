import React, { useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Crosshair } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface InspectOverlayProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

const PROBE_SCRIPT = `
(function() {
  if (window.__lovableProbeActive) return;
  window.__lovableProbeActive = true;
  
  let overlay = document.getElementById('__lovable_overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = '__lovable_overlay';
    overlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);z-index:99999;transition:all 0.1s;display:none;border-radius:2px;';
    document.body.appendChild(overlay);
  }
  
  document.addEventListener('mousemove', function(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === overlay) return;
    const rect = el.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  });
  
  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    let fiber = null;
    for (const key of Object.keys(el)) {
      if (key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')) {
        fiber = el[key];
        break;
      }
    }
    let source = null;
    if (fiber) {
      let node = fiber;
      while (node) {
        if (node._debugSource) { source = node._debugSource; break; }
        node = node.return || node._owner;
      }
    }
    window.parent.postMessage({ type: 'lovable:open-source', source, tagName: el.tagName }, '*');
  }, true);
  
  window.onerror = function(msg, url, line, col, err) {
    window.parent.postMessage({ type: 'lovable:error', message: String(msg), url, line, col, stack: err?.stack ?? '' }, '*');
  };
  
  window.addEventListener('unhandledrejection', function(e) {
    window.parent.postMessage({ type: 'lovable:error', message: String(e.reason), stack: e.reason?.stack ?? '' }, '*');
  });
})();
`;

export function InspectToggleButton() {
  const { inspectMode, setInspectMode } = useStore();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={inspectMode ? 'default' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => setInspectMode(!inspectMode)}
        >
          <Crosshair className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {inspectMode ? 'Exit inspect mode' : 'Inspect element (click to open in editor)'}
      </TooltipContent>
    </Tooltip>
  );
}

export function useInspectMode(iframeRef: React.RefObject<HTMLIFrameElement>) {
  const { inspectMode, setMode, openTab } = useStore();

  const injectProbe = useCallback(() => {
    try {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      const doc = iframe.contentDocument ?? iframe.contentWindow.document;
      const script = doc.createElement('script');
      script.textContent = PROBE_SCRIPT;
      doc.head?.appendChild(script);
    } catch {
      // cross-origin — ignore
    }
  }, [iframeRef]);

  useEffect(() => {
    if (!inspectMode) return;
    injectProbe();

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'lovable:open-source') {
        const { source } = e.data;
        if (source?.fileName) {
          setMode('code');
          openTab(source.fileName, '', 'typescript');
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [inspectMode, injectProbe, setMode, openTab]);
}
