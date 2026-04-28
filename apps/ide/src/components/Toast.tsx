import React, { useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import type { Toast } from "../types";
import { cn } from "../utils";

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ICONS: Record<Toast["type"], React.ReactNode> = {
  success: <CheckCircle2 size={15} className="text-emerald-400" />,
  error: <AlertCircle size={15} className="text-red-400" />,
  info: <Info size={15} className="text-blue-400" />,
  warning: <AlertTriangle size={15} className="text-yellow-400" />,
};

const BORDER_COLORS: Record<Toast["type"], string> = {
  success: "border-emerald-500/20",
  error: "border-red-500/20",
  info: "border-blue-500/20",
  warning: "border-yellow-500/20",
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 bg-[#1a1a1d] border rounded-xl shadow-xl max-w-sm animate-fade-in",
        BORDER_COLORS[toast.type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{ICONS[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-[#9898a5] mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-[#9898a5] hover:text-white transition-colors mt-0.5"
      >
        <X size={13} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
