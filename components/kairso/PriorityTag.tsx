import { PRIORITY_META, priorityLevel } from "@/lib/domain/task";

export function PriorityTag({ priority, showLabel = true }: { priority: number | null | undefined; showLabel?: boolean }) {
  const level = priorityLevel(priority);
  if (level === null) return <span className="text-[12px] text-ink-disabled">—</span>;
  const m = PRIORITY_META[level];
  return (
    <span
      className="inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-1.5 text-[11px] font-semibold"
      style={{ color: m.color, background: m.bg, borderColor: m.border }}
    >
      <span className="font-mono">{m.tag}</span>
      {showLabel && <span className="font-medium">{m.label}</span>}
    </span>
  );
}
