import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Toolbar from '@/components/Toolbar';
import ChatPanel from '@/components/ChatPanel';
import PreviewPanel from '@/components/PreviewPanel';
import CodePanel from '@/components/CodePanel';
import CloudPanel from '@/components/CloudPanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import TerminalDrawer from '@/components/TerminalDrawer';

export type Mode = 'preview' | 'files' | 'code' | 'cloud' | 'analytics';
export type Viewport = 'desktop' | 'tablet' | 'mobile' | 'fullscreen';

const VIEWPORT_SIZES: Record<Viewport, { width: number | string; height: number | string }> = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: 768, height: '100%' },
  mobile: { width: 375, height: '100%' },
  fullscreen: { width: '100%', height: '100%' },
};

export default function App() {
  const [mode, setMode] = useState<Mode>('preview');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [route, setRoute] = useState('/');
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [iframeSrc] = useState('about:blank');

  const renderRightPanel = () => {
    switch (mode) {
      case 'preview':
        return (
          <PreviewPanel
            src={iframeSrc}
            viewport={viewport}
            viewportSizes={VIEWPORT_SIZES}
            route={route}
            onRouteChange={setRoute}
          />
        );
      case 'code':
      case 'files':
        return <CodePanel />;
      case 'cloud':
        return <CloudPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        viewport={viewport}
        onViewportChange={setViewport}
        route={route}
        onRouteChange={setRoute}
        onTerminalToggle={() => setTerminalOpen((v) => !v)}
      />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          <Panel defaultSize={28} minSize={20} maxSize={45}>
            <ChatPanel />
          </Panel>
          <PanelResizeHandle className="w-px bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />
          <Panel minSize={40}>
            <div className="h-full flex flex-col">
              {renderRightPanel()}
              {terminalOpen && (
                <TerminalDrawer onClose={() => setTerminalOpen(false)} />
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
