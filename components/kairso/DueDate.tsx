import type { TaskStatus } from "@/lib/api/schema";
import { fmtDayMonth } from "@/lib/domain/format";
import { isDueToday, isOverdue } from "@/lib/domain/task";

export function DueDate({ date, status }: { date?: string; status?: TaskStatus }) {
  if (!date) return <span className="font-mono text-[12px] text-ink-disabled">—</span>;
  const overdue = isOverdue({ endDate: date, status });
  const today = isDueToday({ endDate: date, status });
  return (
    <span
      className={`whitespace-nowrap font-mono text-[12px] ${overdue ? "font-medium text-danger" : today ? "font-medium text-ink" : "text-ink-muted"}`}
      title={overdue ? "Quá hạn" : undefined}
    >
      {today ? "Hôm nay" : fmtDayMonth(date)}
      {overdue && <span className="sr-only"> (quá hạn)</span>}
    </span>
  );
}
