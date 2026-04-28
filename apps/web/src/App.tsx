import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Toaster } from 'sonner';
import Toolbar from '@/components/Toolbar';
import ChatPanel from '@/components/ChatPanel';
import PreviewPanel from '@/components/PreviewPanel';
import CodePanel from '@/components/CodePanel';
import CloudPanel from '@/components/CloudPanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import TerminalDrawer from '@/components/TerminalDrawer';
import CommandPalette from '@/components/CommandPalette';
import SettingsPanel from '@/components/SettingsPanel';
import OnboardingFlow from '@/components/OnboardingFlow';
import GitHubImportDialog from '@/components/GitHubImportDialog';
import SupabaseWizard from '@/components/SupabaseWizard';
import ProjectSwitcher from '@/components/ProjectSwitcher';
import MobileBottomNav from '@/components/MobileBottomNav';
import QRPairingModal from '@/components/QRPairingModal';
import { useStore } from '@/store/useStore';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useSwipe } from '@/hooks/useSwipe';
import { cn } from '@/lib/utils';

export type Mode = 'preview' | 'files' | 'code' | 'cloud' | 'analytics';
export type Viewport = 'desktop' | 'tablet' | 'mobile' | 'fullscreen';

const VIEWPORT_SIZES: Record<Viewport, { width: number | string; height: number | string }> = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: 768, height: '100%' },
  mobile: { width: 375, height: '100%' },
  fullscreen: { width: '100%', height: '100%' },
};

const MODES: Mode[] = ['preview', 'files', 'code', 'cloud', 'analytics'];

export default function App() {
  const [mode, setMode] = useState<Mode>('preview');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [route, setRoute] = useState('/');
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [iframeSrc] = useState('about:blank');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Dialogs
  const [githubImportOpen, setGithubImportOpen] = useState(false);
  const [supabaseOpen, setSupabaseOpen] = useState(false);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const [qrPairingOpen, setQrPairingOpen] = useState(false);

  const { commandPaletteOpen, setCommandPaletteOpen } = useStore();

  // Responsive detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Keyboard shortcuts
  useKeyboard([
    {
      combo: { key: 'k', meta: true },
      handler: () => setCommandPaletteOpen(true),
      description: 'Open command palette',
    },
    {
      combo: { key: 'Escape' },
      handler: () => setCommandPaletteOpen(false),
    },
  ]);

  // Swipe gestures for mobile mode switching
  const modeIndex = MODES.indexOf(mode);
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (isMobile && !mobileChatOpen) {
        setMode(MODES[Math.min(modeIndex + 1, MODES.length - 1)]);
      }
    },
    onSwipeRight: () => {
      if (isMobile && !mobileChatOpen) {
        setMode(MODES[Math.max(modeIndex - 1, 0)]);
      }
    },
  });

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
    <>
      {/* Onboarding */}
      <OnboardingFlow />

      {/* Toast provider */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'oklch(0.17 0 0)',
            border: '1px solid oklch(0.3 0 0)',
            color: 'oklch(0.985 0 0)',
          },
        }}
      />

      {/* Global dialogs */}
      <CommandPalette
        onModeChange={setMode}
        onOpenGitHubImport={() => setGithubImportOpen(true)}
        onOpenSupabase={() => setSupabaseOpen(true)}
        onOpenProjectWizard={() => setProjectSwitcherOpen(true)}
        onTerminalToggle={() => setTerminalOpen((v) => !v)}
      />
      <SettingsPanel />
      <GitHubImportDialog open={githubImportOpen} onClose={() => setGithubImportOpen(false)} />
      <SupabaseWizard open={supabaseOpen} onClose={() => setSupabaseOpen(false)} />
      <ProjectSwitcher
        open={projectSwitcherOpen}
        onClose={() => setProjectSwitcherOpen(false)}
        onOpenGitHubImport={() => { setProjectSwitcherOpen(false); setGithubImportOpen(true); }}
      />
      <QRPairingModal open={qrPairingOpen} onClose={() => setQrPairingOpen(false)} />

      {/* Main layout */}
      <div
        className={cn(
          'flex flex-col bg-background',
          isMobile ? 'h-[100dvh] w-screen overflow-hidden pb-16' : 'h-screen w-screen overflow-hidden',
        )}
        {...swipeHandlers}
      >
        <Toolbar
          mode={mode}
          onModeChange={setMode}
          viewport={viewport}
          onViewportChange={setViewport}
          route={route}
          onRouteChange={setRoute}
          onTerminalToggle={() => setTerminalOpen((v) => !v)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenGitHubImport={() => setGithubImportOpen(true)}
          onOpenSupabase={() => setSupabaseOpen(true)}
          onOpenProjectSwitcher={() => setProjectSwitcherOpen(true)}
          onOpenQRPairing={() => setQrPairingOpen(true)}
        />

        {/* Desktop layout */}
        {!isMobile && (
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
        )}

        {/* Mobile layout */}
        {isMobile && (
          <div className="flex-1 overflow-hidden relative">
            {mobileChatOpen ? (
              <ChatPanel />
            ) : (
              <div className="h-full flex flex-col">
                {renderRightPanel()}
              </div>
            )}
          </div>
        )}

        {/* Mobile bottom nav */}
        {isMobile && (
          <MobileBottomNav
            mode={mode}
            onModeChange={setMode}
            chatOpen={mobileChatOpen}
            onChatToggle={() => setMobileChatOpen((v) => !v)}
          />
        )}
      </div>
    </>
  );
}
