"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api/endpoints";
import type {
  CreateFeedbackRequest,
  CreateInitiativeRequest,
  CreateLateLogRequest,
  SetAttitudeRequest,
  UpdateFeedbackRequest,
  UpdateInitiativeRequest,
  UpdateLateLogRequest,
  UpsertKPISettingsRequest,
} from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";

export const useLateLogs = (ws: string, params: { lateUserId?: string; from?: string; to?: string } = {}) =>
  useQuery({ queryKey: qk.lateLogs(ws, params), queryFn: () => fetchAll((q) => api.getWorkspaceLateLogs(ws, { ...params, ...q })), enabled: !!ws });
export const useInitiatives = (ws: string, params: { status?: string; proposerId?: string } = {}) =>
  useQuery({ queryKey: qk.initiatives(ws, params), queryFn: () => fetchAll((q) => api.getWorkspaceInitiatives(ws, { ...params, ...q })), enabled: !!ws });
export const useCustomerFeedbacks = (ws: string, params: { memberId?: string } = {}) =>
  useQuery({ queryKey: qk.feedbacks(ws, params), queryFn: () => fetchAll((q) => api.getWorkspaceFeedbacks(ws, { ...params, ...q })), enabled: !!ws });

export const useKpi = (ws: string, month: string, memberId?: string, enabled = true) =>
  useQuery({ queryKey: qk.kpi(ws, "all", { month, memberId }), queryFn: () => api.getWorkspaceKpi(ws, { month, memberId }), enabled: enabled && !!ws });
export const useMyKpi = (ws: string, month: string) => useQuery({ queryKey: qk.kpi(ws, "me", { month }), queryFn: () => api.getWorkspaceKpiMe(ws, { month }), enabled: !!ws });
export const useMemberBreakdown = (ws: string, memberId: string, month: string) =>
  useQuery({ queryKey: qk.kpi(ws, "breakdown", { memberId, month }), queryFn: () => api.getWorkspaceMemberBreakdown(ws, memberId, { month }), enabled: !!ws && !!memberId });
export const useKpiSettings = (ws: string, enabled: boolean) => useQuery({ queryKey: qk.kpi(ws, "settings"), queryFn: () => api.getWorkspaceKpiSettings(ws), enabled: enabled && !!ws });

export function usePerformanceMutations(ws: string) {
  const qc = useQueryClient();
  const inv = (...roots: string[]) => () => roots.forEach((r) => qc.invalidateQueries({ queryKey: [r] }));
  return {
    createLateLog: useMutation({ mutationFn: (b: CreateLateLogRequest) => api.postWorkspaceLateLogs(ws, b), onSuccess: inv("late-logs", "kpi") }),
    updateLateLog: useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateLateLogRequest }) => api.patchLateLog(id, body), onSuccess: inv("late-logs", "kpi") }),
    deleteLateLog: useMutation({ mutationFn: (id: string) => api.deleteLateLog(id), onSuccess: inv("late-logs", "kpi") }),
    createInitiative: useMutation({ mutationFn: (b: CreateInitiativeRequest) => api.postWorkspaceInitiatives(ws, b), onSuccess: inv("initiatives", "kpi") }),
    updateInitiative: useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateInitiativeRequest }) => api.patchInitiative(id, body), onSuccess: inv("initiatives", "kpi") }),
    deleteInitiative: useMutation({ mutationFn: (id: string) => api.deleteInitiative(id), onSuccess: inv("initiatives", "kpi") }),
    createFeedback: useMutation({ mutationFn: (b: CreateFeedbackRequest) => api.postWorkspaceFeedbacks(ws, b), onSuccess: inv("feedbacks", "kpi") }),
    updateFeedback: useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateFeedbackRequest }) => api.patchFeedback(id, body), onSuccess: inv("feedbacks", "kpi") }),
    deleteFeedback: useMutation({ mutationFn: (id: string) => api.deleteFeedback(id), onSuccess: inv("feedbacks", "kpi") }),
    setAttitude: useMutation({ mutationFn: (b: SetAttitudeRequest) => api.putWorkspaceKpiAttitude(ws, b), onSuccess: inv("kpi") }),
    saveKpiSettings: useMutation({ mutationFn: (b: UpsertKPISettingsRequest) => api.putWorkspaceKpiSettings(ws, b), onSuccess: inv("kpi") }),
  };
}
