"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { TaskDetailPanel } from "@/components/kairso/TaskDetailPanel";

export default function TaskPage({ params }: { params: Promise<{ projectId: string; taskId: string }> }) {
  const { projectId, taskId } = use(params);
  const router = useRouter();
  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <TaskDetailPanel taskId={taskId} variant="page" onClose={() => router.push(`/projects/${projectId}/tasks`)} />
    </div>
  );
}
