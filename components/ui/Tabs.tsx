"use client";

import type { ReactNode } from "react";
import { CountBadge } from "./CountBadge";

interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
  icon?: ReactNode;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className = "",
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={`flex items-center gap-1 overflow-x-auto border-b border-line ${className}`}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={`-mb-px inline-flex h-9 shrink-0 items-center gap-1.5 rounded-t-md border-b-[3px] px-3 text-[13px] transition-colors ${
              active
                ? "border-accent font-semibold text-accent-ink"
                : "border-transparent text-ink-muted hover:bg-hover hover:text-ink"
            }`}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && t.count > 0 && <CountBadge value={t.count} tone={active ? "accent" : "neutral"} />}
          </button>
        );
      })}
    </div>
  );
}
