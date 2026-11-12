import { tr } from "@/lib/i18n";

export interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function StackedBar({ segments, height = 10, showLegend = true, label }: { segments: Segment[]; height?: number; showLegend?: boolean; label: string }) {
  const total = segments.reduce((n, s) => n + s.value, 0);
  const shown = segments.filter((s) => s.value > 0);
  return (
    <div>
      <div role="img" aria-label={`${label}: ${segments.filter((s) => s.value > 0).map((s) => `${s.label} ${s.value}`).join(", ") || tr().ui.noData}`} className="flex w-full gap-[2px] overflow-hidden rounded-full bg-hover" style={{ height }}>
        {shown.map((s) => (
          <span key={s.key} title={`${s.label}: ${s.value}`} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} className="min-w-[3px] first:rounded-l-full last:rounded-r-full" />
        ))}
      </div>
      {showLegend && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {segments.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5 text-[12px] text-ink-2">
              <span className="size-2 rounded-[2px]" style={{ background: s.color }} aria-hidden="true" />
              {s.label}
              <span className="font-mono text-ink-muted">{s.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
