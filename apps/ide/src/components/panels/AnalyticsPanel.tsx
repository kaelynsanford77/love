import { BarChart2, TrendingUp, Users, Eye } from "lucide-react";

interface AnalyticsPanelProps {
  projectId: string | null;
}

export function AnalyticsPanel({ projectId }: AnalyticsPanelProps) {
  if (!projectId) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <BarChart2 size={40} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">Select a project to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center">
      <div className="text-5xl mb-4">📊</div>
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
        No analytics data yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        Analytics will appear once your app has visitors. Deploy your app to start collecting data.
      </p>
      <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-xs opacity-40">
        {[
          { icon: Eye, label: "Page Views", value: "—" },
          { icon: Users, label: "Unique Visitors", value: "—" },
          { icon: TrendingUp, label: "Sessions", value: "—" },
          { icon: BarChart2, label: "Bounce Rate", value: "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left">
            <Icon size={16} className="text-gray-400 mb-2" />
            <div className="text-lg font-bold text-gray-700 dark:text-gray-300">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
