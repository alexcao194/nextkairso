"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { TaskResponse } from "@/lib/api/schema";
import { useProjectData } from "@/lib/hooks/useProjectData";
import { useCreateTask } from "@/lib/hooks/tasks";
import { useToast } from "@/lib/toast/ToastProvider";
import { priorityToApi } from "@/lib/domain/task";
import { ProjectToolbar } from "@/components/project/ProjectToolbar";
import { TaskTable } from "@/components/project/TaskTable";
import { ErrorState, SkeletonRows } from "@/components/ui/feedback";
import { TaskCards } from "@/components/project/TaskCards";

export default function ProjectTasksPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const d = useProjectData(projectId);
  const create = useCreateTask(d.workspaceId, projectId);
  const toast = useToast();
  const router = useRouter();

  const open = (t: TaskResponse) => d.setParams({ task: t.id });
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
      />
      {d.tasks.isLoading ? (
        <SkeletonRows rows={10} />
      ) : d.tasks.isError ? (
        <ErrorState error={d.tasks.error} onRetry={() => d.tasks.refetch()} />
      ) : (
        <>
          <div className="hidden min-h-0 flex-1 flex-col sm:flex">
            <TaskTable
              groups={d.groups}
              columns={d.columns}
              modules={d.modules.data ?? []}
              selectedId={d.taskId}
              onOpen={open}
              onAdd={async (title) => {
                try {
                  const t = await create.mutateAsync({ body: { title, status: "todo", priority: priorityToApi(2) } });
                  toast.success(`Đã tạo ${t.code}`);
                } catch (e) {
                  toast.error(e);
                }
              }}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto sm:hidden">
            <TaskCards groups={d.groups} onOpen={(t) => router.push(`/projects/${projectId}/tasks/${t.id}`)} />
          </div>
        </>
      )}
    </>
  );
}
