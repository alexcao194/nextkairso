import { DEFAULT_LABEL_COLOR } from "@/lib/domain/label";

export function LabelChip({ name, color }: { name: string; color?: string }) {
  const c = color || DEFAULT_LABEL_COLOR;
  return (
    <span
      className="inline-flex h-5 max-w-[140px] shrink-0 items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium text-ink-2"
      style={{
        background: `color-mix(in srgb, ${c} 12%, var(--surface))`,
        borderColor: `color-mix(in srgb, ${c} 32%, var(--surface))`,
      }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: c }} aria-hidden="true" />
      <span className="truncate">{name}</span>
    </span>
  );
}
