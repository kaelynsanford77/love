import { useState } from "react";
import { Github, Globe, CheckCircle } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ImportGitHubModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

type Step = "connect" | "configure" | "importing";

export function ImportGitHubModal({ open, onClose, onImported }: ImportGitHubModalProps) {
  const { importProject, activateProject } = useProjectStore();
  const [step, setStep] = useState<Step>("connect");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [projectName, setProjectName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!repoUrl.trim()) { setError("Repository URL is required"); return; }

    const url = repoUrl.trim();
    const autoName =
      projectName.trim() ||
      url.replace(/\.git$/, "").split("/").pop() ||
      "imported-project";

    setIsImporting(true);
    setError(null);
    setStep("importing");

    try {
      const project = await importProject(url, branch, autoName);
      if (project?.id) {
        await activateProject(project.id);
      }
      toast.success("🎉 Import complete! Preview is loading...", { duration: 4000 });
      onImported();
    } catch (e) {
      setError(String(e));
      setStep("configure");
    }
    setIsImporting(false);
  };

  const reset = () => {
    setStep("connect");
    setRepoUrl("");
    setBranch("main");
    setProjectName("");
    setError(null);
    setIsImporting(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) { reset(); onClose(); } }}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
            <Github size={18} className="text-white dark:text-gray-900" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Import from GitHub</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Import any public or private repository</p>
          </div>
          <button
            onClick={() => { reset(); onClose(); }}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {step === "importing" ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Importing repository...</h3>
              <p className="text-xs text-gray-500">Cloning, installing dependencies, starting dev server</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Repo URL */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Repository URL
                </label>
                <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
                  <Globe size={14} className="ml-3 text-gray-400 shrink-0" />
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="flex-1 px-2 py-2.5 text-sm bg-transparent text-gray-800 dark:text-gray-200 outline-none placeholder-gray-400"
                    autoFocus
                  />
                </div>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Branch
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Optional name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Project name (optional)
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Auto-detected from repo name"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {error && (
                <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { reset(); onClose(); }}
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting || !repoUrl.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors font-medium"
                >
                  <Github size={14} />
                  Import Repository
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Supports all public repos. For private repos, the orchestrator needs GitHub auth configured.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
