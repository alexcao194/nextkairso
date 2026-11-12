"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconClose } from "@/components/icons";
import { IconButton } from "./Button";
import { tr } from "@/lib/i18n";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
      style={{ maxWidth: width }}
      className="m-auto w-[calc(100%-32px)] rounded-xl border border-line bg-surface p-0 text-ink shadow-overlay backdrop:bg-[var(--scrim)] max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none"
    >
      {open && (
        <div className="flex max-h-[86vh] flex-col">
          <header className="flex items-start gap-3 border-b border-line px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <h2 id="modal-title" className="text-[15px] font-semibold">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-[12.5px] text-ink-muted">{description}</p>}
            </div>
            <IconButton label={tr().ui.close} variant="ghost" size="sm" onClick={onClose}>
              <IconClose size={14} />
            </IconButton>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>
          )}
        </div>
      )}
    </dialog>
  );
}
