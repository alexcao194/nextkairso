"use client";

import { use, useMemo } from "react";
import type { TaskResponse } from "@/lib/api/schema";
import { STATUS_META } from "@/lib/domain/task";
import { useProjectData } from "@/lib/hooks/useProjectData";
import { ProjectToolbar } from "@/components/project/ProjectToolbar";
import { Gantt, type GanttRow } from "@/components/project/Gantt";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/feedback";
import { IconTimeline } from "@/components/icons";

export default function ProjectTimelinePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const d = useProjectData(projectId);

  const { rows, unscheduled } = useMemo(() => {
    const scheduled: TaskResponse[] = [];
    let none = 0;
    for (const t of d.filtered) (t.startDate || t.endDate ? scheduled.push(t) : none++);
    scheduled.sort((a, b) => new Date(a.startDate ?? a.endDate!).getTime() - new Date(b.startDate ?? b.endDate!).getTime());
    const rows: GanttRow[] = scheduled.map((t) => {
      const start = new Date(t.startDate ?? t.endDate!);
      const end = new Date(t.endDate ?? t.startDate!);
      return {
        id: t.id,
        title: `${t.code} · ${t.title}`,
        onOpen: () => d.setParams({ task: t.id }),
        label: (
          <span className="flex min-w-0 items-center gap-2">
            <span className="size-2 shrink-0 rounded-full" style={{ background: STATUS_META[t.status].dot }} aria-hidden="true" />
            <span className="shrink-0 font-mono text-[11px] text-ink-faint">{t.code}</span>
            <span className="truncate">{t.title}</span>
          </span>
        ),
        bars: [{ start, end: end < start ? start : end, color: STATUS_META[t.status].chart, label: t.title }],
      };
    });
    return { rows, unscheduled: none };
  }, [d.filtered, d.setParams]);

  const total = useMemo(() => d.filtered.reduce((n, t) => n + t.estimation, 0), [d.filtered]);

  return (
    <>
      <ProjectToolbar
        view={d.view}
        setParams={d.setParams}
        columns={d.columns}
        setColumns={d.setColumns}
        members={d.members.data ?? []}
        labels={d.labels.data ?? []}
        modules={d.modules.data ?? []}
        count={d.filtered.length}
        totalEstimation={total}
        showColumns={false}
        showGroup={false}
      />
      {d.tasks.isLoading ? (
        <SkeletonRows rows={8} />
      ) : d.tasks.isError ? (
        <ErrorState error={d.tasks.error} onRetry={() => d.tasks.refetch()} />
      ) : (
        <>
          {unscheduled > 0 && (
            <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-1.5 text-[12px] text-ink-muted">
              <Badge>{unscheduled}</Badge> task chưa có ngày bắt đầu/hạn nên không hiện trên timeline.
            </div>
          )}
          <Gantt
            rows={rows}
            empty={<EmptyState icon={<IconTimeline size={28} />} title="Chưa có task nào được lên lịch" description="Đặt ngày bắt đầu hoặc hạn cho task để thấy chúng trên timeline." className="flex-1" />}
          />
        </>
      )}
    </>
  );
}
