import React, { useState } from 'react';
import {
  Code,
  MessageSquare,
  Eye,
  Package,
  Image,
  Terminal,
  Zap,
  Accessibility,
  Bot,
  GitBranch,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIDEStore } from '@/store/useIDEStore';

import { FileTree } from '@/components/ide/FileTree';
import { CodeEditor } from '@/components/ide/CodeEditor';
import { Preview } from '@/components/preview/Preview';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { PackageManager } from '@/components/panels/PackageManager';
import { AssetManager } from '@/components/panels/AssetManager';
import { Inspector } from '@/components/panels/Inspector';
import { LighthousePanel } from '@/components/panels/LighthousePanel';
import { AccessibilityPanel } from '@/components/panels/AccessibilityPanel';
import { SubAgentsPanel } from '@/components/panels/SubAgentsPanel';
import { ShadcnBrowser } from '@/components/panels/ShadcnBrowser';
import { HistoryPanel } from '@/components/panels/HistoryPanel';

type LeftTab = 'files' | 'chat';
type RightTab = 'editor' | 'preview' | 'split';

const BOTTOM_PANELS = [
  { id: 'inspector', label: 'Inspector', icon: Terminal },
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'assets', label: 'Assets', icon: Image },
  { id: 'lighthouse', label: 'Lighthouse', icon: Zap },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
  { id: 'agents', label: 'Sub-agents', icon: Bot },
] as const;

export default function App() {
  const [leftTab, setLeftTab] = useState<LeftTab>('chat');
  const [rightTab, setRightTab] = useState<RightTab>('split');
  const [showSidebar, setShowSidebar] = useState(true);
  const { activeBottomPanel, setActiveBottomPanel, showShadcnBrowser, setShowShadcnBrowser } = useIDEStore();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-11 bg-background border-b border-border flex items-center px-3 gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              L
            </div>
            <span className="text-sm font-semibold">Lovable IDE</span>
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Sidebar toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Sidebar</TooltipContent>
          </Tooltip>

          {/* Left tab switcher */}
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            <button
              className={cn(
                'px-2 py-1 rounded text-xs transition-colors',
                leftTab === 'chat' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setLeftTab('chat')}
            >
              <MessageSquare className="w-3 h-3 inline mr-1" />
              Chat
            </button>
            <button
              className={cn(
                'px-2 py-1 rounded text-xs transition-colors',
                leftTab === 'files' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setLeftTab('files')}
            >
              <Code className="w-3 h-3 inline mr-1" />
              Files
            </button>
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Right tab switcher */}
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            <button
              className={cn(
                'px-2 py-1 rounded text-xs transition-colors',
                rightTab === 'editor' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setRightTab('editor')}
            >
              <Code className="w-3 h-3 inline mr-1" />
              Editor
            </button>
            <button
              className={cn(
                'px-2 py-1 rounded text-xs transition-colors',
                rightTab === 'split' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setRightTab('split')}
            >
              Split
            </button>
            <button
              className={cn(
                'px-2 py-1 rounded text-xs transition-colors',
                rightTab === 'preview' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setRightTab('preview')}
            >
              <Eye className="w-3 h-3 inline mr-1" />
              Preview
            </button>
          </div>

          <div className="flex-1" />

          {/* Action buttons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => setShowShadcnBrowser(true)}
              >
                <Palette className="w-3.5 h-3.5" />
                Components
              </Button>
            </TooltipTrigger>
            <TooltipContent>Browse shadcn/ui components</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setActiveBottomPanel('inspector')}
              >
                <GitBranch className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>History</TooltipContent>
          </Tooltip>
        </header>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar */}
          {showSidebar && (
            <div className="w-80 border-r border-border shrink-0 flex flex-col overflow-hidden">
              {leftTab === 'chat' ? <ChatPanel /> : <FileTree />}
            </div>
          )}

          {/* Main area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Editor + Preview */}
            <div className="flex-1 flex overflow-hidden">
              {(rightTab === 'editor' || rightTab === 'split') && (
                <div className={cn('flex-1 overflow-hidden', rightTab === 'split' && 'border-r border-border')}>
                  <CodeEditor />
                </div>
              )}
              {(rightTab === 'preview' || rightTab === 'split') && (
                <div className="flex-1 overflow-hidden">
                  <Preview />
                </div>
              )}
            </div>

            {/* Bottom panel toggle bar */}
            <div className="h-8 bg-background border-t border-border flex items-center px-2 gap-1 shrink-0">
              {BOTTOM_PANELS.map((panel) => {
                const Icon = panel.icon;
                return (
                  <Tooltip key={panel.id}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                          activeBottomPanel === panel.id
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                        onClick={() => setActiveBottomPanel(panel.id)}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{panel.label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{panel.label}</TooltipContent>
                  </Tooltip>
                );
              })}

              <div className="flex-1" />

              {/* History button in bottom bar */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    onClick={() => setActiveBottomPanel(activeBottomPanel === 'inspector' ? null : 'inspector')}
                  >
                    {activeBottomPanel ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronUp className="w-3 h-3" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Toggle panel</TooltipContent>
              </Tooltip>
            </div>

            {/* Bottom panel content */}
            {activeBottomPanel && (
              <div className="h-64 border-t border-border shrink-0 overflow-hidden">
                {activeBottomPanel === 'inspector' && <Inspector />}
                {activeBottomPanel === 'packages' && <PackageManager />}
                {activeBottomPanel === 'assets' && <AssetManager />}
                {activeBottomPanel === 'lighthouse' && <LighthousePanel />}
                {activeBottomPanel === 'accessibility' && <AccessibilityPanel />}
                {activeBottomPanel === 'agents' && <SubAgentsPanel />}
              </div>
            )}
          </div>
        </div>

        {/* Shadcn component browser modal */}
        {showShadcnBrowser && <ShadcnBrowser />}
      </div>
    </TooltipProvider>
  );
}
