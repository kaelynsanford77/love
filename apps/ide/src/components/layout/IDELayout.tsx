import { useState, useEffect } from "react";
import { Toolbar } from "./Toolbar";
import { ChatPanel } from "@/components/panels/ChatPanel";
import { PreviewPanel } from "@/components/panels/PreviewPanel";
import { CodePanel } from "@/components/panels/CodePanel";
import { CloudPanel } from "@/components/panels/CloudPanel";
import { AnalyticsPanel } from "@/components/panels/AnalyticsPanel";
import { MobileNav } from "./MobileNav";
import { MobileChatDrawer } from "@/components/panels/MobileChatDrawer";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/lib/utils";

export function IDELayout() {
  const { panelMode, activeProjectId } = useProjectStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Top Toolbar */}
      <Toolbar
        isMobile={isMobile}
        onChatToggle={() => setMobileDrawerOpen(true)}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: side-by-side panels */}
        {!isMobile && (
          <>
            {/* Left: Chat */}
            <div
              className={cn(
                "flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900",
                "w-80 xl:w-96 shrink-0"
              )}
            >
              <ChatPanel projectId={activeProjectId} />
            </div>

            {/* Right: Main panel */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {panelMode === "preview" && <PreviewPanel projectId={activeProjectId} />}
              {panelMode === "code" && <CodePanel projectId={activeProjectId} />}
              {panelMode === "cloud" && <CloudPanel projectId={activeProjectId} />}
              {panelMode === "analytics" && <AnalyticsPanel projectId={activeProjectId} />}
              {panelMode === "chat" && <PreviewPanel projectId={activeProjectId} />}
            </div>
          </>
        )}

        {/* Mobile: single panel */}
        {isMobile && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {panelMode === "chat" && <PreviewPanel projectId={activeProjectId} />}
            {panelMode === "preview" && <PreviewPanel projectId={activeProjectId} />}
            {panelMode === "code" && <CodePanel projectId={activeProjectId} />}
            {panelMode === "cloud" && <CloudPanel projectId={activeProjectId} />}
            {panelMode === "analytics" && <AnalyticsPanel projectId={activeProjectId} />}
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <MobileNav onChatOpen={() => setMobileDrawerOpen(true)} />
      )}

      {/* Mobile chat drawer */}
      {isMobile && (
        <MobileChatDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          projectId={activeProjectId}
        />
      )}
    </div>
  );
}
