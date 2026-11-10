"use client";

import { useQuery } from "@tanstack/react-query";
import { getWorkspaceTaskStatistics, getWorkspaceTaskStatisticsMe, type GetWorkspaceTaskStatisticsQuery } from "@/lib/api/endpoints";
import { qk } from "@/lib/query/keys";

export function useTaskStats(ws: string, params: GetWorkspaceTaskStatisticsQuery, enabled = true) {
  return useQuery({ queryKey: qk.stats(ws, "task", params), queryFn: () => getWorkspaceTaskStatistics(ws, params), enabled: enabled && !!ws });
}
export function useMyTaskStats(ws: string, params: { projectId?: string; month?: string } = {}) {
  return useQuery({ queryKey: qk.stats(ws, "task-me", params), queryFn: () => getWorkspaceTaskStatisticsMe(ws, params), enabled: !!ws });
}
