import { useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface NewProjectWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Template = "blank" | "with-supabase";

const TEMPLATES: { id: Template; icon: string; title: string; description: string }[] = [
  {
    id: "blank",
    icon: "⚛️",
    title: "Blank",
    description: "Vite + React + Tailwind + shadcn/ui",
  },
  {
    id: "with-supabase",
    icon: "🗄️",
    title: "With Supabase",
    description: "Blank + Supabase client pre-configured",
  },
];

export function NewProjectWizard({ open, onClose, onCreated }: NewProjectWizardProps) {
  const { createProject, activateProject } = useProjectStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [template, setTemplate] = useState<Template>("blank");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { return; }
    setIsCreating(true);
    try {
      const project = await createProject(name.trim(), template);
      if (project?.id) {
        await activateProject(project.id);
      }
      toast.success(`🎉 Project "${name}" created!`);
      onCreated();
      setStep(1);
      setName("");
      setTemplate("blank");
    } catch (e) {
      toast.error(`Failed to create project: ${e}`);
    }
    setIsCreating(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">New Project</h2>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  step >= s ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
                )}
              />
            ))}
          </div>
        </div>

        <div className="p-5">
          {step === 1 ? (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Choose a template
              </h3>
              <div className="space-y-2">
                {TEMPLATES.map(({ id, icon, title, description }) => (
                  <button
                    key={id}
                    onClick={() => setTemplate(id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                      template === id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
                    </div>
                    {template === id && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2.5 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                >
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Name your project
              </h3>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="My awesome app"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !name.trim()}
                  className="flex-1 px-4 py-2.5 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {isCreating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
