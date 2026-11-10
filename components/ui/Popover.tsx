"use client";

import { IconCheck } from "@/components/icons";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface TriggerProps {
  ref: (el: HTMLElement | null) => void;
  onClick: () => void;
  "aria-haspopup": "menu" | "dialog";
  "aria-expanded": boolean;
  "aria-controls": string | undefined;
}

export function Popover({
  trigger,
  children,
  align = "start",
  role = "dialog",
  minWidth,
}: {
  trigger: (p: TriggerProps & { open: boolean }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  role?: "menu" | "dialog";
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const triggerEl = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open || !triggerEl.current || !panel.current) return;
    const r = triggerEl.current.getBoundingClientRect();
    const w = panel.current.offsetWidth;
    const h = panel.current.offsetHeight;
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const flip = h > below && above > below;
    let left = align === "end" ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    setPos({
      top: flip ? Math.max(8, r.top - Math.min(h, above) - 4) : r.bottom + 4,
      left,
      maxHeight: Math.max(160, flip ? above : below),
    });
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !triggerEl.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        triggerEl.current?.focus();
      }
    };
    const onScroll = (e: Event) => {
      if (!panel.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  return (
    <>
      {trigger({
        open,
        ref: (el) => {
          triggerEl.current = el;
        },
        onClick: () => {
          setPos(null);
          setOpen((o) => !o);
        },
        "aria-haspopup": role,
        "aria-expanded": open,
        "aria-controls": open ? id : undefined,
      })}
      {open && (
        <div
          ref={panel}
          id={id}
          role={role}
          style={{
            position: "fixed",
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            maxHeight: pos?.maxHeight,
            minWidth,
            visibility: pos ? "visible" : "hidden",
          }}
          className="z-50 overflow-y-auto rounded-lg border border-line-strong bg-surface p-1 shadow-overlay"
        >
          {children(close)}
        </div>
      )}
    </>
  );
}

interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
  checked?: boolean;
  separated?: boolean;
  hint?: string;
}

export function Menu({
  trigger,
  items,
  align = "start",
  minWidth = 180,
}: {
  trigger: (p: TriggerProps & { open: boolean }) => ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  minWidth?: number;
}) {
  return (
    <Popover trigger={trigger} align={align} role="menu" minWidth={minWidth}>
      {(close) => (
        <ul className="flex flex-col">
          {items.map((it, i) => (
            <li key={`${it.label}-${i}`} role="none">
              {it.separated && <div className="my-1 h-px bg-line" role="separator" />}
              <button
                type="button"
                role="menuitem"
                disabled={it.disabled}
                onClick={() => {
                  close();
                  it.onSelect?.();
                }}
                className={`flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] disabled:cursor-not-allowed disabled:text-ink-disabled ${
                  it.danger ? "text-danger hover:bg-danger-bg" : "text-ink hover:bg-hover"
                }`}
              >
                {it.icon && <span className="shrink-0 text-ink-faint">{it.icon}</span>}
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {it.hint && <span className="font-mono text-[11px] text-ink-faint">{it.hint}</span>}
                {it.checked && <IconCheck size={14} className="text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}
