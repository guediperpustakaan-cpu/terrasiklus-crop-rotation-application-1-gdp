"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastKind = "sukses" | "error" | "info" | "peringatan";

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastKind, { ring: string; icon: ReactNode; accent: string }> = {
  sukses: {
    ring: "ring-leaf-200",
    accent: "bg-leaf-600",
    icon: <CheckCircle2 className="size-5 text-leaf-600" aria-hidden />,
  },
  error: {
    ring: "ring-clay-200",
    accent: "bg-clay-500",
    icon: <XCircle className="size-5 text-clay-600" aria-hidden />,
  },
  peringatan: {
    ring: "ring-harvest-300",
    accent: "bg-harvest-500",
    icon: <AlertTriangle className="size-5 text-harvest-700" aria-hidden />,
  },
  info: {
    ring: "ring-bark-200",
    accent: "bg-bark-600",
    icon: <Info className="size-5 text-bark-600" aria-hidden />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current.slice(-2), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 5200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 bottom-20 z-[70] flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const style = STYLES[toast.kind];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative flex gap-3 overflow-hidden rounded-2xl bg-white p-4 shadow-lift ring-1 ${style.ring} animate-pop`}
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${style.accent}`} aria-hidden />
              <div className="shrink-0 pl-1">{style.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-bark-900">{toast.title}</p>
                {toast.detail ? <p className="mt-0.5 text-xs leading-relaxed text-bark-600">{toast.detail}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 rounded-lg p-1 text-bark-400 transition hover:bg-bark-100 hover:text-bark-700"
                aria-label="Tutup notifikasi"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast harus dipakai di dalam ToastProvider");
  return context;
}
