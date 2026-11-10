import type { TaskStatus } from "@/lib/api/schema";
import { STATUS_META } from "@/lib/domain/task";

export function StatusChip({ status, size = "md" }: { status: TaskStatus; size?: "sm" | "md" }) {
  const m = STATUS_META[status] ?? STATUS_META.backlog;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium ${
        size === "sm" ? "h-5 px-2 text-[11px]" : "h-[22px] px-2.5 text-[12px]"
      }`}
      style={{ background: m.bg, color: m.fg }}
    >
      <span className="size-1.5 rounded-full" style={{ background: m.dot }} aria-hidden="true" />
      {m.label}
    </span>
  );
}
