"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  deleteTask,
  deleteTaskFaultHolder,
  deleteTaskLabel,
  deleteTaskWorker,
  getTask,
  getWorkspaceProjectTasks,
  getWorkspaceProjectLabels,
  getWorkspaceProjectMembers,
  getProjectModules,
  patchTask,
  postWorkspaceProjectLabels,
  postWorkspaceProjectTasks,
  putTaskFaultHolder,
  putTaskLabel,
  putTaskWorker,
  type GetWorkspaceProjectTasksQuery,
} from "@/lib/api/endpoints";
import type {
  CreateTaskRequest,
  TaskResponse,
  UpdateTaskRequest,
} from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";

const TASK_PAGE = 200;

type TaskListFilter = Omit<GetWorkspaceProjectTasksQuery, "limit" | "page">;
interface TaskList {
  items: TaskResponse[];
  totalCount: number;
  totalEstimation: number;
}

export function useProjectTasks(ws: string, projectId: string, filter: TaskListFilter = {}, enabled = true) {
  return useQuery({
    queryKey: qk.tasks(ws, projectId, filter),
    enabled: enabled && !!ws && !!projectId,
    queryFn: async (): Promise<TaskList> => {
      let stats = { totalCount: 0, totalEstimation: 0 };
      const items = await fetchAll(async (q) => {
        const res = await getWorkspaceProjectTasks(ws, projectId, { ...filter, ...q });
        stats = res.stats ?? stats;
        return { items: res.items ?? [], page: res.page ?? q.page, limit: res.limit ?? q.limit, hasMore: !!res.hasMore };
      }, TASK_PAGE, 5);
      return { items, totalCount: stats.totalCount || items.length, totalEstimation: stats.totalEstimation };
    },
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: qk.task(id ?? ""),
    queryFn: () => getTask(id!),
    enabled: !!id,
  });
}

export function useProjectMembers(ws: string, projectId: string) {
  return useQuery({
    queryKey: qk.projectMembers(ws, projectId),
    queryFn: async () => (await getWorkspaceProjectMembers(ws, projectId, { limit: 200 })).items ?? [],
    enabled: !!ws && !!projectId,
  });
}

export function useProjectLabels(ws: string, projectId: string) {
  return useQuery({
    queryKey: qk.labels(ws, projectId),
    queryFn: () => fetchAll((q) => getWorkspaceProjectLabels(ws, projectId, q)),
    enabled: !!ws && !!projectId,
  });
}

export function useProjectModules(ws: string, projectId: string) {
  return useQuery({
    queryKey: qk.modules(ws, projectId),
    queryFn: () => fetchAll((q) => getProjectModules(projectId, q)),
    enabled: !!ws && !!projectId,
  });
}

type Patch = (t: TaskResponse) => TaskResponse;

function mapTaskList(old: unknown, fn: (list: TaskResponse[]) => TaskResponse[]): unknown {
  if (Array.isArray(old)) return fn(old as TaskResponse[]);
  const o = old as { items?: TaskResponse[] } | undefined;
  return o?.items ? { ...o, items: fn(o.items) } : old;
}

export function patchTaskEverywhere(qc: QueryClient, id: string, fn: Patch) {
  const mapList = (old: unknown) => mapTaskList(old, (list) => list.map((t) => (t.id === id ? fn(t) : t)));
  qc.setQueriesData({ queryKey: ["tasks"] }, mapList);
  qc.setQueriesData({ queryKey: ["my-tasks"] }, mapList);
  qc.setQueryData<TaskResponse>(qk.task(id), (t) => (t ? fn(t) : t));
}

const replaceTaskEverywhere = (qc: QueryClient, task: TaskResponse) =>
  patchTaskEverywhere(qc, task.id, (old) => ({ ...old, ...task }));

export type TaskPatch = { [K in keyof UpdateTaskRequest]?: UpdateTaskRequest[K] | null };

export function endOfDayISO(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59).toISOString();
}
export function startOfDayISO(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0).toISOString();
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TaskPatch }) => patchTask(id, patch as UpdateTaskRequest),
    onMutate: async ({ id, patch }) => {
      await Promise.all([qc.cancelQueries({ queryKey: ["tasks"] }), qc.cancelQueries({ queryKey: ["my-tasks"] })]);
      const snapshots = qc.getQueriesData({ queryKey: ["tasks"] });
      const mine = qc.getQueriesData({ queryKey: ["my-tasks"] });
      const one = qc.getQueryData<TaskResponse>(qk.task(id));
      patchTaskEverywhere(qc, id, (t) => {
        const next = { ...t } as Record<string, unknown>;
        for (const [k, v] of Object.entries(patch)) next[k] = v === null ? undefined : v;
        return next as unknown as TaskResponse;
      });
      return { snapshots, mine, one, id };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      ctx?.mine.forEach(([key, data]) => qc.setQueryData(key, data));
      if (ctx?.one) qc.setQueryData(qk.task(ctx.id), ctx.one);
    },
    onSuccess: (task) => {
      replaceTaskEverywhere(qc, task);
      qc.invalidateQueries({ queryKey: ["task-history"] });
      qc.invalidateQueries({ queryKey: ["overviews"] });
      qc.invalidateQueries({ queryKey: ["my-tasks-count"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: (_r, id) => {
      const drop = (old: unknown) => mapTaskList(old, (list) => list.filter((t) => t.id !== id));
      qc.setQueriesData({ queryKey: ["tasks"] }, drop);
      qc.setQueriesData({ queryKey: ["my-tasks"] }, drop);
      qc.removeQueries({ queryKey: qk.task(id) });
      qc.invalidateQueries({ queryKey: ["my-tasks-count"] });
      qc.invalidateQueries({ queryKey: ["overviews"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

interface NewTaskInput {
  body: Pick<CreateTaskRequest, "title" | "status"> & Partial<CreateTaskRequest>;
  labelIds?: string[];
  workers?: Record<string, number>;
  faultHolders?: Record<string, number>;
}

export function useCreateTask(ws: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, labelIds = [], workers = {}, faultHolders = {} }: NewTaskInput) => {
      const firstFault = Object.keys(faultHolders)[0];
      let task = await postWorkspaceProjectTasks(ws, projectId, {
        archived: false,
        estimation: 0,
        faultHolderId: firstFault,
        ...body,
        title: body.title.trim(),
      });
      for (const id of labelIds) await putTaskLabel(task.id, id);
      for (const [uid, weight] of Object.entries(workers)) await putTaskWorker(task.id, uid, { weight });
      for (const [uid, weight] of Object.entries(faultHolders)) await putTaskFaultHolder(task.id, uid, { weight });
      if (labelIds.length || Object.keys(workers).length || Object.keys(faultHolders).length) {
        task = await getTask(task.id);
      }
      return task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["overviews"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useSyncTaskLabels() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ task, labelIds }: { task: TaskResponse; labelIds: string[] }) => {
      const next = new Set(labelIds);
      const cur = new Set((task.labels ?? []).map((l) => l.id));
      for (const l of cur) if (!next.has(l)) await deleteTaskLabel(task.id, l);
      for (const l of next) if (!cur.has(l)) await putTaskLabel(task.id, l);
      return getTask(task.id);
    },
    onSuccess: (t) => replaceTaskEverywhere(qc, t),
    onError: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

function useSyncPeople(kind: "workers" | "faultHolders") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ task, people }: { task: TaskResponse; people: Record<string, number> }) => {
      const cur = new Map((task[kind] ?? []).map((p) => [p.user.id, p.weight]));
      const put = kind === "workers" ? putTaskWorker : putTaskFaultHolder;
      const del = kind === "workers" ? deleteTaskWorker : deleteTaskFaultHolder;
      for (const uid of cur.keys()) if (!(uid in people)) await del(task.id, uid);
      for (const [uid, weight] of Object.entries(people)) {
        if (cur.get(uid) !== weight) await put(task.id, uid, { weight });
      }
      return getTask(task.id);
    },
    onSuccess: (t) => replaceTaskEverywhere(qc, t),
    onError: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
export const useSyncTaskWorkers = () => useSyncPeople("workers");
export const useSyncTaskFaultHolders = () => useSyncPeople("faultHolders");

export function useCreateLabel(ws: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; color: string }) => postWorkspaceProjectLabels(ws, projectId, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
  });
}

