import React, { useState } from "react";
import { X, Loader2, Github, ChevronRight } from "lucide-react";
import type { Project, Toast } from "../types";
import { importProject } from "../api";
import { cn } from "../utils";

interface GitHubImportModalProps {
  onClose: () => void;
  onImported: (project: Project) => void;
  onToast: (toast: Omit<Toast, "id">) => void;
}

export function GitHubImportModal({ onClose, onImported, onToast }: GitHubImportModalProps) {
  const [step, setStep] = useState(1);
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [name, setName] = useState("");
  const [importing, setImporting] = useState(false);

  const handleUrlChange = (url: string) => {
    setRepoUrl(url);
    // Auto-fill name from repo URL
    const match = url.match(/github\.com\/[^/]+\/([^/]+)/);
    if (match) setName(match[1].replace(".git", ""));
  };

  const handleImport = async () => {
    if (!repoUrl.startsWith("https://github.com/")) {
      onToast({ type: "error", title: "Invalid GitHub URL", message: "Must start with https://github.com/" });
      return;
    }
    setImporting(true);
    try {
      const project = await importProject({ repoUrl, branch, name: name || undefined });
      if (project.error) {
        onToast({ type: "error", title: project.error });
      } else {
        onToast({ type: "success", title: `Imported ${project.name}!`, message: project.message });
        onImported(project);
      }
    } catch {
      onToast({ type: "error", title: "Import failed" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1a1d] rounded-2xl border border-[#2d2d32] shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2d32]">
          <div className="flex items-center gap-2">
            <Github size={16} className="text-white" />
            <h2 className="text-base font-semibold text-white">Import from GitHub</h2>
          </div>
          <button onClick={onClose} className="text-[#9898a5] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[#2d2d32]">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  step >= s ? "bg-brand-600 text-white" : "bg-[#2d2d32] text-[#9898a5]"
                )}
              >
                {s}
              </div>
              {s < 3 && <ChevronRight size={12} className="text-[#2d2d32]" />}
            </React.Fragment>
          ))}
          <span className="text-xs text-[#9898a5] ml-2">
            {step === 1 ? "Repository URL" : step === 2 ? "Branch" : "Project Name"}
          </span>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {step === 1 && (
            <div>
              <label className="text-xs font-medium text-[#9898a5] block mb-1.5">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://github.com/owner/repo"
                autoFocus
                className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors"
              />
              <p className="text-xs text-[#9898a5] mt-1.5">Only public repositories are supported</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="text-xs font-medium text-[#9898a5] block mb-1.5">Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                autoFocus
                className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="text-xs font-medium text-[#9898a5] block mb-1.5">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-project"
                autoFocus
                className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors"
              />
              <div className="mt-3 p-3 bg-[#0f0f10] rounded-lg border border-[#2d2d32] text-xs text-[#9898a5]">
                <p><span className="text-white">Repository:</span> {repoUrl}</p>
                <p className="mt-1"><span className="text-white">Branch:</span> {branch}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={() => { if (step > 1) setStep(step - 1); else onClose(); }}
            className="flex-1 py-2 rounded-lg border border-[#2d2d32] text-sm text-[#9898a5] hover:text-white hover:bg-[#242428] transition-colors"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !repoUrl.startsWith("https://github.com/")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors",
                step === 1 && !repoUrl.startsWith("https://github.com/")
                  ? "bg-[#2d2d32] text-[#9898a5] cursor-not-allowed"
                  : "bg-brand-600 hover:bg-brand-500 text-white"
              )}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={importing}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                importing
                  ? "bg-[#2d2d32] text-[#9898a5] cursor-not-allowed"
                  : "bg-brand-600 hover:bg-brand-500 text-white"
              )}
            >
              {importing && <Loader2 size={14} className="animate-spin-slow" />}
              {importing ? "Importing…" : "Import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
