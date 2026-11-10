"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteProjectFeedbackTask,
  getWorkspaceProjectFeedbackSettings,
  getWorkspaceProjectProjectFeedbacks,
  patchProjectFeedback,
  patchProjectFeedbackResponse,
  patchProjectFeedbackStatus,
  patchWorkspaceProjectFeedbackSettingsShowTimeline,
  postWorkspaceProjectFeedbackSettingsDisable,
  postWorkspaceProjectFeedbackSettingsEnable,
  postWorkspaceProjectFeedbackSettingsRegenerate,
  postWorkspaceProjectProjectFeedbacks,
  putProjectFeedbackTask,
  type GetWorkspaceProjectProjectFeedbacksQuery,
} from "@/lib/api/endpoints";
import type {
  CreateProjectFeedbackRequest,
  FeedbackStatus,
  UpdateFeedbackResponseRequest,
  UpdateProjectFeedbackRequest,
} from "@/lib/api/schema";
import { qk } from "@/lib/query/keys";

export function useProjectFeedbacks(ws: string, projectId: string, filter: Omit<GetWorkspaceProjectProjectFeedbacksQuery, "page" | "limit">) {
  return useQuery({
    queryKey: qk.projectFeedbacks(ws, projectId, filter),
    queryFn: () => getWorkspaceProjectProjectFeedbacks(ws, projectId, { ...filter, limit: 100 }),
    enabled: !!ws && !!projectId,
  });
}

export const useFeedbackSettings = (ws: string, projectId: string) =>
  useQuery({ queryKey: qk.feedbackSettings(ws, projectId), queryFn: () => getWorkspaceProjectFeedbackSettings(ws, projectId), enabled: !!ws && !!projectId });

export function useFeedbackSettingsMutations(ws: string, projectId: string) {
  const qc = useQueryClient();
  const set = (data: unknown) => qc.setQueryData(qk.feedbackSettings(ws, projectId), data);
  return {
    enable: useMutation({ mutationFn: () => postWorkspaceProjectFeedbackSettingsEnable(ws, projectId), onSuccess: set }),
    disable: useMutation({ mutationFn: () => postWorkspaceProjectFeedbackSettingsDisable(ws, projectId), onSuccess: set }),
    regenerate: useMutation({ mutationFn: () => postWorkspaceProjectFeedbackSettingsRegenerate(ws, projectId), onSuccess: set }),
    showTimeline: useMutation({
      mutationFn: (v: boolean) => patchWorkspaceProjectFeedbackSettingsShowTimeline(ws, projectId, { showModuleTimeline: v }),
      onSuccess: set,
    }),
  };
}

export function useFeedbackMutations(ws: string, projectId: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["project-feedbacks"] });
    qc.invalidateQueries({ queryKey: qk.feedbackSummary(ws, projectId) });
    qc.invalidateQueries({ queryKey: ["task-feedbacks"] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };
  return {
    create: useMutation({ mutationFn: (b: CreateProjectFeedbackRequest) => postWorkspaceProjectProjectFeedbacks(ws, projectId, b), onSuccess: refresh }),
    edit: useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateProjectFeedbackRequest }) => patchProjectFeedback(id, body), onSuccess: refresh }),
    setStatus: useMutation({ mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) => patchProjectFeedbackStatus(id, { status }), onSuccess: refresh }),
    respond: useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateFeedbackResponseRequest }) => patchProjectFeedbackResponse(id, body), onSuccess: refresh }),
    link: useMutation({ mutationFn: ({ id, taskId }: { id: string; taskId: string }) => putProjectFeedbackTask(id, taskId), onSuccess: refresh }),
    unlink: useMutation({ mutationFn: ({ id, taskId }: { id: string; taskId: string }) => deleteProjectFeedbackTask(id, taskId), onSuccess: refresh }),
  };
}
