import type { TaskGroup } from "@/lib/domain/taskView";
import type { TaskResponse } from "@/lib/api/schema";
import { AvatarGroup } from "@/components/ui/Avatar";
import { StatusChip } from "@/components/kairso/StatusChip";
import { PriorityTag } from "@/components/kairso/PriorityTag";
import { DueDate } from "@/components/kairso/DueDate";
import { EmptyState } from "@/components/ui/feedback";
import { isOverdue } from "@/lib/domain/task";
import { tr } from "@/lib/i18n";

export function TaskCards({ groups, onOpen }: { groups: TaskGroup[]; onOpen: (t: TaskResponse) => void }) {
  const nonEmpty = groups.filter((g) => g.tasks.length > 0);
  if (nonEmpty.length === 0) return <EmptyState title={tr().ui.noTasks} className="py-16" />;
  return (
    <div>
      {nonEmpty.map((g) => (
        <section key={g.key} aria-label={g.label}>
          <h3 className="sticky top-0 flex h-9 items-center gap-2 border-b border-line bg-group-header px-4 text-[12px] font-medium text-ink-2">
            {g.dot && <span className="size-2 rounded-full" style={{ background: g.dot }} aria-hidden="true" />}
            {g.label}
            <span className="font-mono text-[11px] text-ink-faint">{g.tasks.length}</span>
          </h3>
          <ul>
            {g.tasks.map((t) => (
              <li key={t.id} className="border-b border-line-row">
                <button type="button" onClick={() => onOpen(t)} className="flex min-h-[56px] w-full flex-col justify-center gap-1 px-4 py-2 text-left">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-ink-faint">{t.code}</span>
                    <PriorityTag priority={t.priority} showLabel={false} />
                    <span className="flex-1" />
                    <DueDate date={t.endDate} status={t.status} />
                  </span>
                  <span className="line-clamp-2 text-[14px] font-medium text-ink">{t.title}</span>
                  <span className="flex items-center gap-2">
                    <StatusChip status={t.status} size="sm" />
                    {isOverdue(t) && <span className="rounded bg-danger-bg px-1.5 py-[1px] text-[10.5px] font-semibold text-danger">{tr().ui.overdue}</span>}
                    <span className="flex-1" />
                    <AvatarGroup people={(t.workers ?? []).map((w) => ({ id: w.user.id, name: w.user.name, avatar: w.user.avatar }))} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
