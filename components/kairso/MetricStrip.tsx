import type { ReactNode } from "react";
import { IconTile } from "@/components/ui/IconTile";
import { hueVars, type Hue } from "@/lib/domain/hue";

interface Metric {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "danger";
  hue?: Hue;
  icon?: ReactNode;
}

const CYCLE: Hue[] = ["blue", "violet", "teal", "orange", "pink", "green", "cyan"];

export function MetricStrip({ metrics, compact = false }: { metrics: Metric[]; compact?: boolean }) {
  return (
    <dl className="flex min-h-[64px] overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
      {metrics.map((m, i) => {
        const hue = m.tone === "danger" ? "rose" : (m.hue ?? CYCLE[i % CYCLE.length]);
        return (
          <div
            key={m.label}
            style={hueVars(hue)}
            className={`relative flex flex-1 items-center py-2.5 ${compact ? "min-w-0 gap-2 px-3" : "min-w-[132px] gap-3 px-4"} ${i > 0 ? "border-l border-line" : ""}`}
          >
            {compact ? null : m.icon ? (
              <IconTile hue={hue} size={34}>
                {m.icon}
              </IconTile>
            ) : (
              <span className="h-8 w-1 shrink-0 rounded-full bg-(--hv)" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <dt className="truncate text-[11.5px] font-medium text-ink-muted">{m.label}</dt>
              <dd className={`font-mono text-[20px] font-semibold leading-tight ${m.tone === "danger" ? "text-danger" : "text-ink"}`}>
                {m.value}
                {m.hint && <span className="ml-1 text-[11px] font-normal text-ink-faint">{m.hint}</span>}
              </dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
