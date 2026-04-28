import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { IDELayout } from "@/components/layout/IDELayout";
import { OnboardingFlow } from "@/components/modals/OnboardingFlow";
import { CommandPalette } from "@/components/modals/CommandPalette";
import { useSettingsStore } from "@/stores/settingsStore";
import { useProjectStore } from "@/stores/projectStore";

export default function App() {
  const { onboardingComplete, firstLaunch } = useSettingsStore();
  const { fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (!onboardingComplete) {
    return (
      <>
        <OnboardingFlow />
        <Toaster position="bottom-right" />
      </>
    );
  }

  return (
    <>
      <IDELayout />
      <CommandPalette />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { borderRadius: "8px", fontSize: "13px" },
          duration: 3000,
        }}
      />
    </>
  );
}
