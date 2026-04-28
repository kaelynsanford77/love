import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import type { DeepLinkState } from './types';

import ThreadList from './components/chat/ThreadList';
import ChatPanel from './components/chat/ChatPanel';
import EditorPanel from './components/editor/EditorPanel';
import CloudPanel from './components/cloud/CloudPanel';
import EnvManager from './components/env/EnvManager';
import TailwindAutocomplete from './components/tailwind/TailwindAutocomplete';
import TokenDashboard from './components/tokens/TokenDashboard';
import ResizeHandle from './components/resize/ResizeHandle';

import {
  MessageSquare,
  Code,
  Cloud,
  Key,
  Wand2,
  BarChart3,
  Link2,
} from 'lucide-react';

const NAV_ITEMS: { mode: DeepLinkState['mode']; icon: typeof MessageSquare; label: string }[] = [
  { mode: 'chat', icon: MessageSquare, label: 'Chat' },
  { mode: 'code', icon: Code, label: 'Code' },
  { mode: 'cloud', icon: Cloud, label: 'Cloud' },
  { mode: 'env', icon: Key, label: 'Env' },
  { mode: 'tokens', icon: BarChart3, label: 'Tokens' },
];

export default function App() {
  const store = useAppStore();

  // Parse deep link from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') as DeepLinkState['mode'] | null;
    if (mode && ['chat', 'code', 'preview', 'cloud', 'env', 'tokens'].includes(mode)) {
      store.setDeepLink({
        mode,
        file: params.get('file') ?? undefined,
        line: params.get('line') ? Number(params.get('line')) : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentMode = store.deepLink.mode;

  const handleCodeSplitResize = (delta: number) => {
    const container = document.querySelector('.editor-container');
    if (!container) return;
    const width = container.clientWidth;
    const newRatio = Math.max(0.2, Math.min(0.8, store.panelSizes.codeSplitRatio + delta / width));
    store.setPanelSizes({ codeSplitRatio: newRatio });
  };

  const handleTerminalResize = (delta: number) => {
    store.setPanelSizes({
      terminalHeight: Math.max(50, Math.min(500, store.panelSizes.terminalHeight - delta)),
    });
  };

  const handleChatResize = (delta: number) => {
    store.setPanelSizes({
      chatWidth: Math.max(250, Math.min(600, store.panelSizes.chatWidth + delta)),
    });
  };

  const handleCopyDeepLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="h-screen flex bg-gray-950 text-gray-200">
      {/* Sidebar nav */}
      <nav className="w-14 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-2">
        <div className="text-purple-400 font-bold text-lg mb-4">L</div>
        {NAV_ITEMS.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => store.setDeepLink({ mode })}
            title={label}
            className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
              currentMode === mode
                ? 'bg-purple-600/30 text-purple-400'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Icon size={20} />
          </button>
        ))}

        {/* Tailwind autocomplete nav item */}
        <button
          onClick={() => store.setDeepLink({ mode: 'preview' as DeepLinkState['mode'] })}
          title="Tailwind"
          className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
            currentMode === 'preview'
              ? 'bg-purple-600/30 text-purple-400'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
          }`}
        >
          <Wand2 size={20} />
        </button>

        <div className="mt-auto">
          <button
            onClick={handleCopyDeepLink}
            title="Copy deep link to current state"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 cursor-pointer"
          >
            <Link2 size={20} />
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex min-w-0">
        {/* Chat mode */}
        {currentMode === 'chat' && (
          <>
            <div style={{ width: store.panelSizes.chatWidth }} className="flex flex-col min-w-[250px]">
              <ThreadList
                threads={store.threads}
                activeThreadId={store.activeThreadId}
                onSelect={store.setActiveThread}
                onAdd={store.addThread}
                onDelete={store.deleteThread}
              />
              <div className="flex-1 min-h-0">
                <ChatPanel
                  thread={store.activeThread}
                  onSend={store.sendMessage}
                  onSuggestionClick={store.sendMessage}
                />
              </div>
            </div>
            <ResizeHandle direction="horizontal" onResize={handleChatResize} />
            <div className="flex-1 editor-container min-w-0">
              <EditorPanel
                codeSplitRatio={store.panelSizes.codeSplitRatio}
                terminalHeight={store.panelSizes.terminalHeight}
                onCodeSplitResize={handleCodeSplitResize}
                onTerminalResize={handleTerminalResize}
              />
            </div>
          </>
        )}

        {/* Code mode */}
        {currentMode === 'code' && (
          <div className="flex-1 editor-container">
            <EditorPanel
              codeSplitRatio={store.panelSizes.codeSplitRatio}
              terminalHeight={store.panelSizes.terminalHeight}
              onCodeSplitResize={handleCodeSplitResize}
              onTerminalResize={handleTerminalResize}
            />
          </div>
        )}

        {/* Cloud mode */}
        {currentMode === 'cloud' && (
          <div className="flex-1">
            <CloudPanel seedSql={store.seedSql} onGenerateSeed={store.generateSeedSql} />
          </div>
        )}

        {/* Env mode */}
        {currentMode === 'env' && (
          <div className="flex-1">
            <EnvManager
              envVars={store.envVars}
              onAdd={store.addEnvVar}
              onUpdate={store.updateEnvVar}
              onDelete={store.deleteEnvVar}
            />
          </div>
        )}

        {/* Tokens mode */}
        {currentMode === 'tokens' && (
          <div className="flex-1">
            <TokenDashboard usage={store.tokenUsage} />
          </div>
        )}

        {/* Tailwind / Preview mode */}
        {currentMode === 'preview' && (
          <div className="flex-1">
            <TailwindAutocomplete />
          </div>
        )}
      </div>
    </div>
  );
}
