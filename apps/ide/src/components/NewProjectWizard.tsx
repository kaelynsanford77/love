import React, { useState } from "react";
import { X, Loader2, Zap, Database, Github, Layout } from "lucide-react";
import type { Project, Toast } from "../types";
import { createProject } from "../api";
import { cn } from "../utils";

interface NewProjectWizardProps {
  onClose: () => void;
  onCreated: (project: Project) => void;
  onToast: (toast: Omit<Toast, "id">) => void;
}

const TEMPLATES = [
  { id: "react-vite", label: "React + Vite", description: "Modern React with fast HMR", icon: "⚡" },
  { id: "react-supabase", label: "React + Supabase", description: "React with Supabase backend", icon: "💚" },
  { id: "nextjs", label: "Next.js", description: "Full-stack React framework", icon: "▲" },
  { id: "blank", label: "Blank", description: "Start from scratch", icon: "📄" },
];

export function NewProjectWizard({ onClose, onCreated, onToast }: NewProjectWizardProps) {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("react-vite");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      onToast({ type: "error", title: "Project name is required" });
      return;
    }
    setCreating(true);
    try {
      const project = await createProject({ name: name.trim(), template, description });
      if (project.error) {
        onToast({ type: "error", title: project.error });
      } else {
        onToast({ type: "success", title: `Created ${name}!` });
        onCreated(project);
      }
    } catch {
      onToast({ type: "error", title: "Failed to create project" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1a1d] rounded-2xl border border-[#2d2d32] shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2d32]">
          <h2 className="text-base font-semibold text-white">New Project</h2>
          <button onClick={onClose} className="text-[#9898a5] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-[#9898a5] block mb-1.5">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="my-awesome-app"
              autoFocus
              className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>

          {/* Templates */}
          <div>
            <label className="text-xs font-medium text-[#9898a5] block mb-1.5">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    "flex flex-col gap-1 p-3 rounded-lg border text-left transition-all",
                    template === t.id
                      ? "border-brand-500/60 bg-brand-500/10"
                      : "border-[#2d2d32] bg-[#0f0f10] hover:border-[#3d3d44]"
                  )}
                >
                  <span className="text-base">{t.icon}</span>
                  <span className="text-xs font-medium text-white">{t.label}</span>
                  <span className="text-[10px] text-[#9898a5]">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-[#9898a5] block mb-1.5">
              Description <span className="opacity-50">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you building?"
              className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-[#2d2d32] text-sm text-[#9898a5] hover:text-white hover:bg-[#242428] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              creating || !name.trim()
                ? "bg-[#2d2d32] text-[#9898a5] cursor-not-allowed"
                : "bg-brand-600 hover:bg-brand-500 text-white"
            )}
          >
            {creating && <Loader2 size={14} className="animate-spin-slow" />}
            {creating ? "Creating…" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
