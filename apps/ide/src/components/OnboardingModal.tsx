import React, { useState } from "react";
import { X, Loader2, Zap, ChevronRight, Check } from "lucide-react";
import type { Toast } from "../types";
import { updateSettings } from "../api";
import { cn } from "../utils";

interface OnboardingModalProps {
  onClose: () => void;
  onToast: (toast: Omit<Toast, "id">) => void;
}

export function OnboardingModal({ onClose, onToast }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.quatarly.cloud/v1");
  const [saving, setSaving] = useState(false);

  const steps = [
    {
      title: "Welcome to Lovable Solo ✨",
      description: "Your self-hosted AI IDE. Build full-stack apps with AI assistance.",
      content: (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Zap size={36} className="text-white" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-sm text-[#9898a5] leading-relaxed">
              Chat with AI to build features, browse your code in Monaco editor,
              live-preview your app, and connect Supabase — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {["🤖 AI Chat", "⚡ Live Preview", "📝 Monaco Editor", "☁️ Supabase"].map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1d] rounded-lg border border-[#2d2d32] text-xs text-[#e8e8ed]"
              >
                <Check size={11} className="text-emerald-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Configure your LLM",
      description: "Connect your API key to power the AI assistant.",
      content: (
        <div className="flex flex-col gap-4 py-2">
          <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg text-xs text-brand-300">
            💡 Lovable Solo uses any OpenAI-compatible API. You can use Quatarly, OpenAI, or any proxy.
          </div>
          <div>
            <label className="text-xs font-medium text-[#9898a5] block mb-1.5">API Base URL</label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#9898a5] block mb-1.5">
              API Key <span className="opacity-50">(stored locally)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-… or your key"
              className="w-full bg-[#0f0f10] border border-[#2d2d32] rounded-lg px-3 py-2 text-sm text-white placeholder-[#9898a5] focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
            />
          </div>
        </div>
      ),
    },
    {
      title: "You're all set! 🎉",
      description: "Start building your first project.",
      content: (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Check size={28} className="text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-sm text-[#9898a5]">
              Click <span className="text-white font-medium">"Get Started"</span> to create your
              first project and start chatting with AI.
            </p>
          </div>
          <div className="text-xs text-[#9898a5] bg-[#1a1a1d] px-4 py-3 rounded-lg border border-[#2d2d32] text-center">
            You can always change settings with <kbd className="bg-[#2d2d32] px-1.5 py-0.5 rounded font-mono">⌘,</kbd>
          </div>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;

  const handleNext = async () => {
    if (step === 1 && apiKey) {
      setSaving(true);
      try {
        await updateSettings({ llm: { baseUrl, apiKey } });
      } catch {}
      setSaving(false);
    }
    if (isLast) {
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1a1d] rounded-2xl border border-[#2d2d32] shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#9898a5] font-medium">
              Step {step + 1} of {steps.length}
            </span>
            <button onClick={onClose} className="text-[#9898a5] hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
          <h2 className="text-lg font-semibold text-white">{steps[step].title}</h2>
          <p className="text-sm text-[#9898a5] mt-0.5">{steps[step].description}</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 px-6 mt-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all",
                i === step ? "bg-brand-500 w-6" : i < step ? "bg-brand-700 w-3" : "bg-[#2d2d32] w-3"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-4">{steps[step].content}</div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6 gap-3">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 rounded-lg text-sm text-[#9898a5] hover:text-white hover:bg-[#242428] transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-[#9898a5] hover:text-white hover:bg-[#242428] transition-colors"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white transition-colors"
          >
            {saving && <Loader2 size={13} className="animate-spin-slow" />}
            {isLast ? "Get Started" : "Next"}
            {!isLast && !saving && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
