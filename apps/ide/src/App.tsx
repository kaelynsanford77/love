import React, { useState, useEffect, useCallback } from "react";
import { TopBar } from "./components/TopBar";
import { ChatPanel } from "./components/ChatPanel";
import { EditorPanel } from "./components/EditorPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { CloudPanel } from "./components/CloudPanel";
import { ProjectSwitcher } from "./components/ProjectSwitcher";
import { CommandPalette } from "./components/CommandPalette";
import { SettingsModal } from "./components/SettingsModal";
import { OnboardingModal } from "./components/OnboardingModal";
import { ToastContainer } from "./components/Toast";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { useToast } from "./hooks/useToast";
import { useProjects } from "./hooks/useProjects";
import type { ActiveMode } from "./types";

export default function App() {
  const [activeMode, setActiveMode] = useState<ActiveMode>("chat");
  const [chatOpen, setChatOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const { toasts, addToast, removeToast } = useToast();
  const { projects, activeProject, setActiveProject, loadProjects } = useProjects();

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("lovable_onboarded")) {
      setOnboardingOpen(true);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  const handleModeChange = useCallback((mode: ActiveMode) => {
    setActiveMode(mode);
    if (isMobile && mode === "chat") setChatOpen(true);
  }, [isMobile]);

  const renderMainPanel = () => {
    if (activeMode === "code") {
      return <EditorPanel project={activeProject} onToast={addToast} isMobile={isMobile} />;
    }
    if (activeMode === "cloud") {
      return <CloudPanel project={activeProject} onToast={addToast} isMobile={isMobile} />;
    }
    // chat and preview both show PreviewPanel as main area
    return <PreviewPanel project={activeProject} isMobile={isMobile} />;
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f10] overflow-hidden">
      <TopBar
        activeMode={activeMode}
        onModeChange={handleModeChange}
        onProjectSwitch={() => setProjectSwitcherOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onCommand={() => setCmdOpen(true)}
        activeProject={activeProject}
        isMobile={isMobile}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Chat Panel */}
        {isMobile ? (
          <>
            {chatOpen && (
              <div
                className="absolute inset-0 z-30 bg-black/50"
                onClick={() => setChatOpen(false)}
              />
            )}
            <div
              className={`absolute left-0 top-0 bottom-0 z-40 w-[90vw] max-w-[400px] transition-transform duration-300 ${
                chatOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <ChatPanel
                project={activeProject}
                onToast={addToast}
                onFilesChanged={() => {}}
                isMobile={true}
                onClose={() => setChatOpen(false)}
              />
            </div>
          </>
        ) : (
          <div className="w-[340px] flex-shrink-0 border-r border-[#2d2d32]">
            <ChatPanel
              project={activeProject}
              onToast={addToast}
              onFilesChanged={() => {}}
              isMobile={false}
            />
          </div>
        )}

        {/* Main Panel */}
        <div className="flex flex-1 overflow-hidden">
          {renderMainPanel()}
        </div>
      </div>

      {isMobile && (
        <MobileBottomNav
          activeMode={activeMode}
          onModeChange={handleModeChange}
          onChatOpen={() => setChatOpen(true)}
        />
      )}

      {projectSwitcherOpen && (
        <ProjectSwitcher
          projects={projects}
          activeProject={activeProject}
          onSelect={(p) => {
            setActiveProject(p);
            setProjectSwitcherOpen(false);
            addToast({ type: "success", title: `Switched to ${p.name}` });
          }}
          onClose={() => setProjectSwitcherOpen(false)}
          onToast={addToast}
          onRefresh={loadProjects}
        />
      )}
      {cmdOpen && (
        <CommandPalette
          onClose={() => setCmdOpen(false)}
          onModeChange={handleModeChange}
          onProjectSwitch={() => { setCmdOpen(false); setProjectSwitcherOpen(true); }}
          onSettings={() => { setCmdOpen(false); setSettingsOpen(true); }}
        />
      )}
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} onToast={addToast} />
      )}
      {onboardingOpen && (
        <OnboardingModal
          onClose={() => {
            localStorage.setItem("lovable_onboarded", "1");
            setOnboardingOpen(false);
          }}
          onToast={addToast}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
