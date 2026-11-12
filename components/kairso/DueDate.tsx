import type { TaskStatus } from "@/lib/api/schema";
import { fmtDayMonth } from "@/lib/domain/format";
import { isDueToday, isOverdue } from "@/lib/domain/task";
import { tr } from "@/lib/i18n";

export function DueDate({ date, status }: { date?: string; status?: TaskStatus }) {
  if (!date) return <span className="font-mono text-[12px] text-ink-disabled">—</span>;
  const overdue = isOverdue({ endDate: date, status });
  const today = isDueToday({ endDate: date, status });
  return (
    <span
      className={`whitespace-nowrap font-mono text-[12px] ${overdue ? "font-medium text-danger" : today ? "font-medium text-ink" : "text-ink-muted"}`}
      title={overdue ? tr().ui.overdue : undefined}
    >
      {today ? tr().ui.today : fmtDayMonth(date)}
      {overdue && <span className="sr-only">{tr().ui.overdueSr}</span>}
    </span>
  );
}
