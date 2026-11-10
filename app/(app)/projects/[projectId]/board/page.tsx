"use client";

import { use, useMemo } from "react";
import { useProjectData } from "@/lib/hooks/useProjectData";
import { ProjectToolbar } from "@/components/project/ProjectToolbar";
import { BoardView } from "@/components/project/BoardView";
import { ErrorState, SkeletonRows } from "@/components/ui/feedback";

export default function ProjectBoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const d = useProjectData(projectId);
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
        <SkeletonRows rows={8} height={48} />
      ) : d.tasks.isError ? (
        <ErrorState error={d.tasks.error} onRetry={() => d.tasks.refetch()} />
      ) : (
        <BoardView tasks={d.filtered} modules={d.modules.data ?? []} projectId={projectId} selectedId={d.taskId} onOpen={(t) => d.setParams({ task: t.id })} />
      )}
    </>
  );
}
