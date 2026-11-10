"use client";

import { useMemo } from "react";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { filterTasks, groupTasks, sortTasks } from "@/lib/domain/taskView";
import { useTaskViewState } from "./useTaskView";
import { useProjectLabels, useProjectMembers, useProjectModules, useProjectTasks } from "./tasks";

export function useProjectData(projectId: string) {
  const { workspaceId } = useWorkspace();
  const state = useTaskViewState();
  const { view } = state;

  const tasks = useProjectTasks(workspaceId, projectId, {
    archived: view.archived === "all" ? undefined : view.archived === "archived",
  });
  const modules = useProjectModules(workspaceId, projectId);
  const members = useProjectMembers(workspaceId, projectId);
  const labels = useProjectLabels(workspaceId, projectId);

  const moduleName = useMemo(() => {
    const m = new Map((modules.data ?? []).map((x) => [x.id, x.name]));
    return (id?: string) => (id ? (m.get(id) ?? "") : "");
  }, [modules.data]);
  const memberName = useMemo(() => {
    const m = new Map((members.data ?? []).map((x) => [x.userId, x.userName]));
    return (id: string) => m.get(id) ?? "";
  }, [members.data]);

  const filtered = useMemo(() => sortTasks(filterTasks(tasks.data?.items ?? [], view), view.sort, moduleName), [tasks.data, view, moduleName]);
  const groups = useMemo(() => groupTasks(filtered, view.group, { moduleName, memberName }), [filtered, view.group, moduleName, memberName]);

  return { ...state, workspaceId, tasks, modules, members, labels, filtered, groups, moduleName };
}
