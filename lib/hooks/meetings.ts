"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteMeeting, getMeeting, getTask, getWorkspaceMeetings, patchMeeting, postWorkspaceMeetings } from "@/lib/api/endpoints";
import type { CreateMeetingMinutesRequest, MeetingMinutesResponse, TaskResponse, UpdateMeetingMinutesRequest } from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";
import type { ResourceScope } from "./resources";

export function useMeetings(s: ResourceScope) {
  return useQuery({
    queryKey: qk.meetings(s.ws, s.projectId),
    queryFn: () => fetchAll((q) => getWorkspaceMeetings(s.ws, { ...q, projectId: s.projectId })),
    enabled: !!s.ws,
  });
}

export const useMeeting = (id: string | null | undefined) =>
  useQuery({ queryKey: qk.meeting(id ?? ""), queryFn: () => getMeeting(id!), enabled: !!id });

export function useMeetingMutations(s: ResourceScope) {
  const qc = useQueryClient();
  const sync = (m: MeetingMinutesResponse) => {
    qc.setQueryData(qk.meeting(m.id), m);
    qc.invalidateQueries({ queryKey: ["meetings"] });
  };
  return {
    create: useMutation({
      mutationFn: (b: Omit<CreateMeetingMinutesRequest, "projectId">) => postWorkspaceMeetings(s.ws, { ...b, projectId: s.projectId }),
      onSuccess: sync,
    }),
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateMeetingMinutesRequest }) => patchMeeting(id, body), onSuccess: sync }),
    remove: useMutation({ mutationFn: (id: string) => deleteMeeting(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }) }),
  };
}

export function useLinkedTasks(ids: string[]) {
  const results = useQueries({
    queries: ids.map((id) => ({ queryKey: qk.task(id), queryFn: () => getTask(id), retry: false, staleTime: 30_000 })),
  });
  const map = new Map<string, TaskResponse>();
  results.forEach((r, i) => r.data && map.set(ids[i], r.data));
  return { map, isLoading: results.some((r) => r.isLoading) };
}
