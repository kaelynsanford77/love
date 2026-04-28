import React, { useState, useEffect, useRef } from "react";
import { RefreshCw, Smartphone, Tablet, Monitor, ExternalLink, Globe } from "lucide-react";
import type { Project } from "../types";
import { cn } from "../utils";

interface PreviewPanelProps {
  project: Project | null;
  isMobile: boolean;
}

type Viewport = "mobile" | "tablet" | "desktop";

const VIEWPORT_SIZES: Record<Viewport, { width: string; label: string }> = {
  mobile: { width: "390px", label: "Mobile" },
  tablet: { width: "768px", label: "Tablet" },
  desktop: { width: "100%", label: "Desktop" },
};

export function PreviewPanel({ project, isMobile }: PreviewPanelProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [key, setKey] = useState(0);
  const [url, setUrl] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (project?.devPort) {
      setUrl(`http://localhost:${project.devPort}`);
    } else {
      setUrl("");
    }
  }, [project?.devPort, project?.id]);

  const refresh = () => setKey((k) => k + 1);

  const previewUrl = url || (project ? "" : "");

  return (
    <div className="flex flex-col h-full bg-[#0f0f10] flex-1">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2d2d32] bg-[#0f0f10] flex-shrink-0">
        {/* Viewport Controls */}
        <div className="flex items-center gap-0.5 bg-[#1a1a1d] rounded-md p-0.5 border border-[#2d2d32]">
          {(["mobile", "tablet", "desktop"] as Viewport[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewport(v)}
              title={VIEWPORT_SIZES[v].label}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewport === v
                  ? "bg-[#242428] text-white"
                  : "text-[#9898a5] hover:text-[#e8e8ed]"
              )}
            >
              {v === "mobile" && <Smartphone size={13} />}
              {v === "tablet" && <Tablet size={13} />}
              {v === "desktop" && <Monitor size={13} />}
            </button>
          ))}
        </div>

        {/* URL Bar */}
        <div className="flex-1 flex items-center gap-2 bg-[#1a1a1d] rounded-md px-2.5 py-1.5 border border-[#2d2d32]">
          <Globe size={12} className="text-[#9898a5] flex-shrink-0" />
          <span className="text-xs text-[#9898a5] truncate flex-1">
            {previewUrl || (project ? "Start dev server to preview" : "No project selected")}
          </span>
        </div>

        {/* Actions */}
        <button
          onClick={refresh}
          className="p-1.5 rounded-md text-[#9898a5] hover:text-[#e8e8ed] hover:bg-[#1a1a1d] transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-[#9898a5] hover:text-[#e8e8ed] hover:bg-[#1a1a1d] transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Preview Frame */}
      <div className="flex-1 overflow-auto bg-[#0d0d0e] flex items-start justify-center p-4">
        <div
          className="h-full transition-all duration-300 rounded-lg overflow-hidden border border-[#2d2d32] shadow-2xl bg-white"
          style={{ width: isMobile ? "100%" : VIEWPORT_SIZES[viewport].width, minHeight: "100%" }}
        >
          {previewUrl ? (
            <iframe
              key={key}
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-[#0f0f10] text-center p-8 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1a1a1d] border border-[#2d2d32] flex items-center justify-center">
                <Monitor size={28} className="text-[#9898a5]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#e8e8ed]">
                  {project ? "Dev server not running" : "No project selected"}
                </p>
                <p className="text-xs text-[#9898a5] mt-1">
                  {project
                    ? "Start the dev server to see a live preview"
                    : "Create or select a project to see a preview"}
                </p>
              </div>
              {project && (
                <div className="text-xs text-[#9898a5] bg-[#1a1a1d] px-3 py-2 rounded-lg border border-[#2d2d32] font-mono">
                  bun dev
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
