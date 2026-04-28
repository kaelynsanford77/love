import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useProjectStore } from "@/stores/projectStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type Step = 1 | 2 | 3 | 4;

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>(1);
  const [orchestratorUrl, setOrchestratorUrl] = useState("http://localhost:4000");
  const [apiKey, setApiKey] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createMode, setCreateMode] = useState<"new" | "import">("new");
  const [projectName, setProjectName] = useState("My first app");
  const [importUrl, setImportUrl] = useState("");

  const settings = useSettingsStore();
  const { createProject, importProject, activateProject, setActiveProject } = useProjectStore();

  const handleFinish = async () => {
    setIsCreating(true);
    try {
      if (createMode === "new") {
        const project = await createProject(projectName || "My first app");
        if (project?.id) await activateProject(project.id);
      } else if (importUrl) {
        const project = await importProject(importUrl);
        if (project?.id) await activateProject(project.id);
      }
      settings.setMany({
        orchestratorUrl,
        onboardingComplete: true,
        firstLaunch: false,
      });
      toast.success("🚀 Welcome to Lovable Solo!");
    } catch (e) {
      toast.error(`Setup failed: ${e}`);
    }
    setIsCreating(false);
  };

  const STEPS = [
    { n: 1, label: "Welcome" },
    { n: 2, label: "Connect" },
    { n: 3, label: "Project" },
    { n: 4, label: "Tour" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-blue-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map(({ n, label }) => (
            <div key={n} className="flex items-center gap-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                step > n ? "bg-purple-600 text-white" :
                step === n ? "bg-purple-600 text-white ring-4 ring-purple-100 dark:ring-purple-900/50" :
                "bg-gray-200 dark:bg-gray-700 text-gray-500"
              )}>
                {step > n ? <CheckCircle size={14} /> : n}
              </div>
              {n < 4 && <div className={cn(
                "w-8 h-0.5 rounded-full transition-colors",
                step > n ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
              )} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
          {step === 2 && (
            <StepConnect
              orchestratorUrl={orchestratorUrl}
              onUrlChange={setOrchestratorUrl}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepProject
              createMode={createMode}
              onModeChange={setCreateMode}
              projectName={projectName}
              onNameChange={setProjectName}
              importUrl={importUrl}
              onImportUrlChange={setImportUrl}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <StepTour
              onFinish={handleFinish}
              isFinishing={isCreating}
              onBack={() => setStep(3)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
        ✦
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Welcome to Lovable Solo 🚀
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
        Your personal AI-powered IDE. Build web apps from your desktop or phone using state-of-the-art AI models.
      </p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: "🤖", label: "AI-First", desc: "Chat to build" },
          { icon: "📱", label: "Mobile Ready", desc: "Works on phone" },
          { icon: "🚀", label: "Real Projects", desc: "Vite + React" },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</div>
            <div className="text-xs text-gray-500">{desc}</div>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
      >
        Get Started <ArrowRight size={18} />
      </button>
    </div>
  );
}

function StepConnect({ orchestratorUrl, onUrlChange, onNext, onBack }: {
  orchestratorUrl: string; onUrlChange: (v: string) => void; onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Configure Connection</h2>
      <p className="text-sm text-gray-500 mb-6">
        Set the URL of your Lovable orchestrator backend.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Orchestrator URL
          </label>
          <input
            type="url"
            value={orchestratorUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="http://localhost:4000"
            className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-400 mt-1">Leave as-is if running locally</p>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-400">
          💡 Set your Quatarly API key in the orchestrator's <code>.env</code> file:
          <br /><code>OPENAI_API_KEY=your-key</code>
          <br /><code>OPENAI_BASE_URL=https://api.quatarly.cloud/v1</code>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button onClick={onNext} className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
          Next <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function StepProject({
  createMode, onModeChange, projectName, onNameChange, importUrl, onImportUrlChange, onNext, onBack
}: {
  createMode: "new" | "import"; onModeChange: (v: "new" | "import") => void;
  projectName: string; onNameChange: (v: string) => void;
  importUrl: string; onImportUrlChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your First Project</h2>
      <p className="text-sm text-gray-500 mb-6">How would you like to start?</p>

      <div className="flex gap-2 mb-4">
        {[
          { id: "new" as const, label: "✨ New Project" },
          { id: "import" as const, label: "📥 Import from GitHub" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onModeChange(id)}
            className={cn(
              "flex-1 py-2.5 text-sm rounded-xl border-2 transition-all font-medium",
              createMode === id
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {createMode === "new" ? (
        <input
          type="text"
          value={projectName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="My awesome app"
          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
          autoFocus
        />
      ) : (
        <input
          type="url"
          value={importUrl}
          onChange={(e) => onImportUrlChange(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
          autoFocus
        />
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={createMode === "import" && !importUrl.trim()}
          className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          Next <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function StepTour({ onFinish, isFinishing, onBack }: {
  onFinish: () => void; isFinishing: boolean; onBack: () => void;
}) {
  const TOUR_STEPS = [
    {
      icon: "💬",
      title: "Chat with AI",
      desc: "Describe what you want to build in the chat panel. The AI will write all the code.",
    },
    {
      icon: "👁️",
      title: "See it live",
      desc: "Your app previews in real-time as the AI builds it. Switch to Preview mode.",
    },
    {
      icon: "📱",
      title: "Work from anywhere",
      desc: "Open this URL on your phone to code on the go. Tap the chat icon to open the AI drawer.",
    },
  ];

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Quick Tour</h2>
      <div className="space-y-4 mb-8">
        {TOUR_STEPS.map(({ icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <span className="text-2xl shrink-0">{icon}</span>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button
          onClick={onFinish}
          disabled={isFinishing}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isFinishing ? "Setting up..." : "Let's build! 🚀"}
        </button>
      </div>
    </div>
  );
}
