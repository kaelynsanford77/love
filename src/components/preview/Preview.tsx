import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Share2,
  Columns,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIDEStore } from '@/store/useIDEStore';
import { PREVIEW_SIZES } from '@/types';
import type { PreviewSize } from '@/types';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.FC<any>> = {
  Monitor,
  Tablet,
  Smartphone,
};

function PreviewFrame({
  width,
  height,
  label,
}: {
  width: number;
  height: number;
  label?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const {
    fileContents,
    previewKey,
    setClickToEditLine,
    setActiveFile,
    addRuntimeError,
    addConsoleEntry,
    addNetworkRequest,
  } = useIDEStore();

  const appCode = fileContents['src/App.tsx'] ?? '';

  // Build preview HTML with click-to-edit support and error forwarding
  const previewHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://cdn.tailwindcss.com"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  [data-line]:hover { outline: 2px solid #6366f1 !important; outline-offset: 2px; cursor: pointer; }
  [data-line].clicked { outline: 2px solid #22c55e !important; outline-offset: 2px; }
</style>
</head>
<body>
<div id="root"></div>
<script type="module">
import React from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';
import { useState } from 'https://esm.sh/react@18';

// Override console methods to forward to parent
const origConsole = { log: console.log, warn: console.warn, error: console.error, info: console.info };
['log', 'warn', 'error', 'info'].forEach(method => {
  console[method] = (...args) => {
    origConsole[method](...args);
    window.parent.postMessage({
      type: 'console',
      method,
      args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))
    }, '*');
  };
});

// Override fetch to track network requests
const origFetch = window.fetch;
window.fetch = async (...args) => {
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
  const method = args[1]?.method || 'GET';
  const reqId = Date.now().toString();
  const start = performance.now();

  window.parent.postMessage({
    type: 'network-start',
    id: reqId,
    method,
    url
  }, '*');

  try {
    const response = await origFetch(...args);
    const duration = Math.round(performance.now() - start);
    window.parent.postMessage({
      type: 'network-end',
      id: reqId,
      status: response.status,
      statusText: response.statusText,
      duration
    }, '*');
    return response;
  } catch (err) {
    window.parent.postMessage({
      type: 'network-end',
      id: reqId,
      status: 0,
      statusText: 'Network Error',
      duration: Math.round(performance.now() - start)
    }, '*');
    throw err;
  }
};

// Error handler
window.onerror = (message, source, line, column, error) => {
  window.parent.postMessage({
    type: 'runtime-error',
    message: String(message),
    stack: error?.stack || '',
    source,
    line,
    column
  }, '*');
};

window.onunhandledrejection = (event) => {
  window.parent.postMessage({
    type: 'runtime-error',
    message: 'Unhandled Promise Rejection: ' + String(event.reason),
    stack: event.reason?.stack || ''
  }, '*');
};

// Click-to-edit handler
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-line]');
  if (el) {
    e.preventDefault();
    e.stopPropagation();
    const line = parseInt(el.getAttribute('data-line'), 10);
    const component = el.closest('[data-component]')?.getAttribute('data-component') || 'App';
    window.parent.postMessage({
      type: 'click-to-edit',
      line,
      component,
      file: 'src/App.tsx'
    }, '*');

    // Visual feedback
    document.querySelectorAll('.clicked').forEach(n => n.classList.remove('clicked'));
    el.classList.add('clicked');
    setTimeout(() => el.classList.remove('clicked'), 1000);
  }
});

// Render App
try {
  ${appCode.replace(/export default /g, 'const __App__ = ')}
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(__App__));
} catch (err) {
  document.getElementById('root').innerHTML =
    '<div style="color:red;padding:20px;font-family:monospace;">' +
    '<h2>Render Error</h2><pre>' + err.message + '</pre></div>';
  window.parent.postMessage({
    type: 'runtime-error',
    message: err.message,
    stack: err.stack
  }, '*');
}
<\/script>
</body>
</html>`;
  }, [appCode]);

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data;
      if (!data?.type) return;

      switch (data.type) {
        case 'click-to-edit':
          setActiveFile(data.file);
          setClickToEditLine(data.line);
          break;
        case 'runtime-error':
          addRuntimeError({
            message: data.message,
            stack: data.stack,
            source: data.source,
            line: data.line,
            column: data.column,
          });
          break;
        case 'console':
          addConsoleEntry({
            type: data.method,
            args: data.args,
          });
          break;
        case 'network-start':
          addNetworkRequest({
            method: data.method,
            url: data.url,
            status: undefined,
            duration: undefined,
          });
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [setActiveFile, setClickToEditLine, addRuntimeError, addConsoleEntry, addNetworkRequest]);

  return (
    <div className="relative" style={{ width: '100%', height: '100%' }}>
      {label && (
        <div className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur text-xs px-2 py-1 rounded border border-border">
          {label}
        </div>
      )}
      <iframe
        ref={iframeRef}
        key={previewKey}
        srcDoc={previewHtml}
        className="w-full h-full border-0 bg-white rounded"
        sandbox="allow-scripts allow-same-origin"
        title="Preview"
      />
    </div>
  );
}

export function Preview() {
  const {
    previewSize,
    setPreviewSize,
    refreshPreview,
    showResponsiveComparison,
    toggleResponsiveComparison,
    generateShareableLink,
    shareableLink,
  } = useIDEStore();

  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    generateShareableLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showResponsiveComparison) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-10 bg-background border-b border-border flex items-center px-3 gap-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">Responsive Comparison</span>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={toggleResponsiveComparison}>
            <Monitor className="w-4 h-4 mr-1" />
            Single View
          </Button>
        </div>
        <div className="flex-1 flex gap-2 p-2 overflow-auto bg-muted/30">
          {PREVIEW_SIZES.map((size) => (
            <div key={size.name} className="flex flex-col items-center gap-1 shrink-0">
              <span className="text-xs text-muted-foreground">
                {size.name} ({size.width}×{size.height})
              </span>
              <div
                className="border border-border rounded overflow-hidden bg-white"
                style={{
                  width: Math.min(size.width, 400),
                  height: Math.min(size.height, 500),
                  transform: `scale(${Math.min(400 / size.width, 1)})`,
                  transformOrigin: 'top left',
                }}
              >
                <PreviewFrame width={size.width} height={size.height} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-10 bg-background border-b border-border flex items-center px-3 gap-1 shrink-0">
        <span className="text-xs font-medium text-muted-foreground mr-2">Preview</span>

        {/* Device size buttons */}
        {PREVIEW_SIZES.map((size) => {
          const Icon = ICON_MAP[size.icon];
          return (
            <Button
              key={size.name}
              size="icon"
              variant={previewSize === size.name ? 'secondary' : 'ghost'}
              className="h-7 w-7"
              onClick={() => setPreviewSize(size.name)}
              title={`${size.name} (${size.width}×${size.height})`}
            >
              <Icon className="w-3.5 h-3.5" />
            </Button>
          );
        })}

        <div className="w-px h-5 bg-border mx-1" />

        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={refreshPreview} title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={toggleResponsiveComparison}
          title="Responsive comparison"
        >
          <Columns className="w-3.5 h-3.5" />
        </Button>

        <div className="flex-1" />

        {/* Share button */}
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleShare}>
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Share'}
        </Button>

        {shareableLink && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => window.open(shareableLink, '_blank')}
            title="Open shared preview"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Preview iframe */}
      <div className="flex-1 bg-muted/20 flex items-start justify-center p-4 overflow-auto">
        <div
          className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
          style={{
            width: PREVIEW_SIZES.find((s) => s.name === previewSize)?.width ?? 1440,
            maxWidth: '100%',
            height: '100%',
          }}
        >
          <PreviewFrame
            width={PREVIEW_SIZES.find((s) => s.name === previewSize)?.width ?? 1440}
            height={PREVIEW_SIZES.find((s) => s.name === previewSize)?.height ?? 900}
          />
        </div>
      </div>
    </div>
  );
}
