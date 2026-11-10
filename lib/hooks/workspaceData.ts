"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getWorkspaceHistory,
  getWorkspaceMyTasks,
  getWorkspaceNotifications,
  getWorkspaceProjectsOverviews,
  type GetWorkspaceMyTasksQuery,
} from "@/lib/api/endpoints";
import type { TaskResponse } from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";

export function useMyTasks(ws: string, filter: Omit<GetWorkspaceMyTasksQuery, "page" | "limit"> = {}) {
  return useQuery({
    queryKey: qk.myTasks(ws, filter),
    enabled: !!ws,
    queryFn: async (): Promise<TaskResponse[]> =>
      fetchAll(async (q) => {
        const r = await getWorkspaceMyTasks(ws, { ...filter, ...q });
        return { items: r.items ?? [], page: r.page ?? q.page, limit: r.limit ?? q.limit, hasMore: !!r.hasMore };
      }, 200, 5),
  });
}

export const useNotifications = (ws: string, limit = 50) =>
  useQuery({ queryKey: [...qk.notifications(ws), limit], queryFn: async () => (await getWorkspaceNotifications(ws, { limit })).items ?? [], enabled: !!ws });

export const useProjectOverviews = (ws: string, ids: string[]) =>
  useQuery({
    queryKey: qk.overviews(ws, ids),
    queryFn: async () => (await getWorkspaceProjectsOverviews(ws, { projectIds: ids.join(",") })).items ?? [],
    enabled: !!ws && ids.length > 0,
  });

export const useWorkspaceHistory = (ws: string, limit = 12) =>
  useQuery({ queryKey: [...qk.history(ws), limit], queryFn: async () => (await getWorkspaceHistory(ws, { limit })).items ?? [], enabled: !!ws });
