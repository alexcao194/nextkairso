"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteTaskAttachment,
  deleteTaskComment,
  getTaskAttachments,
  getTaskComments,
  getTaskFeedbacks,
  getTaskHistory,
  getWorkspaceProjectTasks,
  patchTaskComment,
  postTaskAttachments,
  postTaskComments,
} from "@/lib/api/endpoints";
import type { CreateTaskAttachmentRequest, CreateTaskCommentRequest } from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";
import { patchTaskEverywhere } from "./tasks";

export function useTaskComments(taskId: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.taskComments(taskId),
    queryFn: async () => {
      const list = await getTaskComments(taskId);
      patchTaskEverywhere(qc, taskId, (t) => ({ ...t, unreadCommentCount: 0 }));
      qc.invalidateQueries({ queryKey: ["threads"] });
      qc.invalidateQueries({ queryKey: ["threads-count"] });
      return list ?? [];
    },
    enabled: !!taskId,
  });
}

export function useCommentMutations(taskId: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: qk.taskComments(taskId) });
  return {
    add: useMutation({ mutationFn: (b: CreateTaskCommentRequest) => postTaskComments(taskId, b), onSuccess: refresh }),
    edit: useMutation({
      mutationFn: ({ id, content }: { id: string; content: string }) => patchTaskComment(taskId, id, { content }),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => deleteTaskComment(taskId, id), onSuccess: refresh }),
  };
}

export function useTaskHistory(taskId: string, enabled = true) {
  return useQuery({
    queryKey: qk.taskHistory(taskId),
    queryFn: () => fetchAll((q) => getTaskHistory(taskId, q), 50, 4),
    enabled: enabled && !!taskId,
  });
}

export function useTaskAttachments(taskId: string) {
  return useQuery({ queryKey: qk.taskAttachments(taskId), queryFn: async () => (await getTaskAttachments(taskId)) ?? [], enabled: !!taskId });
}

export function useAttachmentMutations(taskId: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: qk.taskAttachments(taskId) });
  return {
    add: useMutation({ mutationFn: (b: CreateTaskAttachmentRequest) => postTaskAttachments(taskId, b), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => deleteTaskAttachment(taskId, id), onSuccess: refresh }),
  };
}

export function useSubtasks(ws: string, projectId: string, parentId: string) {
  return useQuery({
    queryKey: qk.subtasks(ws, projectId, parentId),
    queryFn: async () => (await getWorkspaceProjectTasks(ws, projectId, { parentId, limit: 100 })).items ?? [],
    enabled: !!ws && !!projectId && !!parentId,
  });
}

export function useTaskFeedbacks(taskId: string, enabled: boolean) {
  return useQuery({ queryKey: qk.taskFeedbacks(taskId), queryFn: async () => (await getTaskFeedbacks(taskId)) ?? [], enabled: enabled && !!taskId });
}
