"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { IconCheck, IconClose, IconAlert } from "@/components/icons";
import { ApiError } from "@/lib/api/http";
import { tr } from "../i18n/dict";

type Tone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  tone: Tone;
  message: string;
}
interface ToastApi {
  success: (m: string) => void;
  error: (m: string | unknown) => void;
  info: (m: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const toneClass: Record<Tone, string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-accent-ink",
};

function errorMessage(e: unknown, fallback = tr().ui.genericError): string {
  if (typeof e === "string") return e;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (tone: Tone, message: string) => {
      const id = nextId.current++;
      setItems((l) => [...l.slice(-3), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => {
        if (m instanceof ApiError && m.status === 401) return;
        push("error", errorMessage(m));
      },
      info: (m) => push("info", m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[76px] z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:items-end sm:px-0"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex max-w-[380px] items-start gap-2.5 rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-[13px] text-ink shadow-overlay"
          >
            <span className={`mt-0.5 shrink-0 ${toneClass[t.tone]}`}>
              {t.tone === "success" ? <IconCheck size={15} /> : <IconAlert size={15} />}
            </span>
            <span className="min-w-0 flex-1 break-words">{t.message}</span>
            <button
              type="button"
              aria-label={tr().ui.closeToast}
              onClick={() => dismiss(t.id)}
              className="-mr-1 shrink-0 rounded p-0.5 text-ink-faint hover:bg-hover hover:text-ink"
            >
              <IconClose size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
