import { useState, useRef } from "react";
import { RefreshCw, Share2, Smartphone, Tablet, Monitor, ExternalLink } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/lib/utils";

interface PreviewPanelProps {
  projectId: string | null;
}

const VIEWPORTS = [
  { id: "mobile", icon: Smartphone, label: "Mobile", width: 390 },
  { id: "tablet", icon: Tablet, label: "Tablet", width: 768 },
  { id: "desktop", icon: Monitor, label: "Desktop", width: "100%" },
];

export function PreviewPanel({ projectId }: PreviewPanelProps) {
  const { projects } = useProjectStore();
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const project = projects.find((p) => p.id === projectId);
  const previewUrl = project?.port ? `http://localhost:${project.port}` : null;

  const handleRefresh = () => setKey((k) => k + 1);

  const handleShare = async () => {
    if (previewUrl && navigator.share) {
      await navigator.share({ title: project?.name, url: previewUrl });
    } else if (previewUrl) {
      navigator.clipboard.writeText(previewUrl);
    }
  };

  const vp = VIEWPORTS.find((v) => v.id === viewport)!;
  const iframeWidth = vp.width;

  if (!projectId || !project) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-950">
        <div className="text-5xl mb-4">🖼️</div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
          No preview available
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Start chatting to create your app!
        </p>
      </div>
    );
  }

  if (project.status === "stopped" || !previewUrl) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-950">
        <div className="text-5xl mb-4">⏹️</div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Dev server stopped
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Activate the project to start the preview.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      {/* Preview toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shrink-0">
        {/* URL bar */}
        <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
          <span className="truncate">{previewUrl}</span>
        </div>

        {/* Viewport switcher */}
        <div className="hidden sm:flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {VIEWPORTS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewport(id as any)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewport === id
                  ? "bg-white dark:bg-gray-700 text-purple-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>

        <button
          onClick={handleRefresh}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw size={14} />
        </button>

        <button
          onClick={handleShare}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Share2 size={14} />
        </button>

        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        <div
          className="relative bg-white shadow-2xl rounded-lg overflow-hidden"
          style={{
            width: typeof iframeWidth === "number" ? `${iframeWidth}px` : "100%",
            height: "100%",
            maxWidth: "100%",
          }}
        >
          {project.status === "starting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-10">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-500">Starting dev server...</p>
            </div>
          )}
          <iframe
            key={key}
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}
