import { IconLayers } from "@/components/icons";

export function ModuleChip({ name }: { name?: string }) {
  if (!name) return <span className="text-[12px] text-ink-disabled">—</span>;
  return (
    <span className="inline-flex max-w-[140px] items-center gap-1 rounded bg-hover px-1.5 py-0.5 text-[11.5px] text-ink-2">
      <IconLayers size={11} className="shrink-0 text-ink-faint" />
      <span className="truncate">{name}</span>
    </span>
  );
}
