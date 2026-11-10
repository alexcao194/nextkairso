"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api/endpoints";
import type {
  AttendanceCheckRequest,
  SubmitAttendanceCorrectionRequest,
  UpsertAttendanceSettingRequest,
  UpsertAttendanceSessionRequest,
  UpsertDailyReportRequest,
  UpsertWorkScheduleRequest,
  UpsertWorkWeekRequest,
} from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";

export const dateOnly = (d: Date) => `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;

export const useAttendanceSettings = (ws: string) =>
  useQuery({ queryKey: qk.attSettings(ws), queryFn: () => api.getWorkspaceAttendanceSettings(ws), enabled: !!ws });

export const useMyCalendar = (ws: string, from: string, to: string) =>
  useQuery({
    queryKey: qk.calendar(ws, "me", { from, to }),
    queryFn: async () => (await api.getWorkspaceCalendarEventsMe(ws, { from, to })) ?? [],
    enabled: !!ws,
  });

export const useMemberCalendar = (ws: string, memberId: string, from: string, to: string) =>
  useQuery({
    queryKey: qk.calendar(ws, "member", { memberId, from, to }),
    queryFn: async () => (await api.getWorkspaceCalendarEvents(ws, { memberId, from, to })) ?? [],
    enabled: !!ws && !!memberId,
  });

export const useMembersCalendar = (ws: string, from: string, to: string, enabled: boolean) =>
  useQuery({
    queryKey: qk.calendar(ws, "members", { from, to }),
    queryFn: () => fetchAll((q) => api.getWorkspaceCalendarMembersEvents(ws, { from, to, ...q }), 100, 5),
    enabled: enabled && !!ws,
  });

export const useMySchedules = (ws: string, from: string, to: string) =>
  useQuery({
    queryKey: qk.schedules(ws, "me", { from, to }),
    queryFn: () => fetchAll((q) => api.getWorkspaceWorkSchedulesMe(ws, { from, to, ...q }), 100, 5),
    enabled: !!ws,
  });

export const useMemberSchedules = (ws: string, memberId: string, from: string, to: string) =>
  useQuery({
    queryKey: qk.schedules(ws, "member", { memberId, from, to }),
    queryFn: () => fetchAll((q) => api.getWorkspaceWorkSchedule(ws, memberId, { from, to, ...q }), 100, 5),
    enabled: !!ws && !!memberId,
  });

export const usePendingSchedules = (ws: string, enabled: boolean) =>
  useQuery({
    queryKey: qk.schedules(ws, "pending"),
    queryFn: () => fetchAll((q) => api.getWorkspaceWorkSchedulesPending(ws, { status: "pending", ...q }), 100, 5),
    enabled: enabled && !!ws,
  });

export const useWorkWeek = (ws: string) => useQuery({ queryKey: qk.workWeek(ws), queryFn: () => api.getWorkspaceWorkWeek(ws), enabled: !!ws });

export const useMyWorkWeek = (ws: string) => useQuery({ queryKey: qk.myWorkWeek(ws), queryFn: () => api.getWorkspaceWorkWeekMe(ws), enabled: !!ws });

export const useMyDailyReports = (ws: string, from: string, to: string) =>
  useQuery({
    queryKey: qk.dailyReports(ws, "me", { from, to }),
    queryFn: () => fetchAll((q) => api.getWorkspaceDailyReportsMe(ws, { from, to, ...q }), 100, 5),
    enabled: !!ws,
  });

export const useDailyReports = (ws: string, filter: { memberId?: string; from: string; to: string }, enabled: boolean) =>
  useQuery({
    queryKey: qk.dailyReports(ws, "all", filter),
    queryFn: () => fetchAll((q) => api.getWorkspaceDailyReports(ws, { ...filter, ...q }), 100, 5),
    enabled: enabled && !!ws,
  });

export const useCheckRequests = (ws: string, scope: "all" | "me", status?: string) =>
  useQuery({
    queryKey: [...qk.checkRequests(ws, scope), status ?? ""],
    queryFn: () =>
      fetchAll((q) => (scope === "me" ? api.getWorkspaceAttendanceCheckRequestsMe(ws, { status, ...q }) : api.getWorkspaceAttendanceCheckRequests(ws, { status, ...q })), 100, 5),
    enabled: !!ws,
  });

export const useAttendanceStats = (ws: string, month: string, memberId?: string, enabled = true) =>
  useQuery({ queryKey: qk.attStats(ws, { month, memberId }), queryFn: () => api.getWorkspaceAttendanceStatistics(ws, { month, memberId }), enabled: enabled && !!ws });
export const useMyAttendanceStats = (ws: string, month: string) =>
  useQuery({ queryKey: qk.attStats(ws, { month, me: true }), queryFn: () => api.getWorkspaceAttendanceStatisticsMe(ws, { month }), enabled: !!ws });

export function useAttendanceMutations(ws: string) {
  const qc = useQueryClient();
  const refreshAtt = () => {
    for (const r of ["att-records", "att-status", "att-stats", "calendar", "kpi"]) qc.invalidateQueries({ queryKey: [r] });
  };
  const refreshSched = () => {
    for (const r of ["schedules", "calendar", "att-stats"]) qc.invalidateQueries({ queryKey: [r] });
  };
  const refreshReports = () => qc.invalidateQueries({ queryKey: ["daily-reports"] });
  const refreshReq = () => {
    qc.invalidateQueries({ queryKey: ["check-requests"] });
    refreshAtt();
  };
  return {
    status: useMutation({ mutationFn: (b: AttendanceCheckRequest) => api.postWorkspaceAttendanceStatus(ws, b) }),
    checkIn: useMutation({ mutationFn: (b: AttendanceCheckRequest) => api.postWorkspaceAttendanceCheckIn(ws, b), onSuccess: refreshAtt }),
    checkOut: useMutation({ mutationFn: (b: AttendanceCheckRequest) => api.postWorkspaceAttendanceCheckOut(ws, b), onSuccess: refreshAtt }),
    submitRequest: useMutation({ mutationFn: (b: SubmitAttendanceCorrectionRequest) => api.postWorkspaceAttendanceCheckRequests(ws, b), onSuccess: refreshReq }),
    approveRequest: useMutation({ mutationFn: (id: string) => api.postWorkspaceAttendanceCheckRequestApprove(ws, id), onSuccess: refreshReq }),
    rejectRequest: useMutation({ mutationFn: (id: string) => api.postWorkspaceAttendanceCheckRequestReject(ws, id), onSuccess: refreshReq }),
    saveMySchedules: useMutation({
      mutationFn: ({ schedules, weekNote }: { schedules: UpsertWorkScheduleRequest[]; weekNote?: string }) => api.putWorkspaceWorkSchedules(ws, { schedules, weekNote }),
      onSuccess: refreshSched,
    }),
    saveMemberSchedules: useMutation({
      mutationFn: ({ memberId, schedules, weekNote }: { memberId: string; schedules: UpsertWorkScheduleRequest[]; weekNote?: string }) => api.putWorkspaceWorkSchedule(ws, memberId, { schedules, weekNote }),
      onSuccess: refreshSched,
    }),
    approveSchedules: useMutation({ mutationFn: ({ memberId, dayIds }: { memberId: string; dayIds: string[] }) => api.postWorkspaceWorkScheduleApprove(ws, memberId, { dayIds }), onSuccess: refreshSched }),
    approveAllSchedules: useMutation({ mutationFn: (memberId: string) => api.postWorkspaceWorkScheduleApproveAll(ws, memberId), onSuccess: refreshSched }),
    rejectSchedules: useMutation({ mutationFn: ({ memberId, dayIds }: { memberId: string; dayIds: string[] }) => api.postWorkspaceWorkScheduleReject(ws, memberId, { dayIds }), onSuccess: refreshSched }),
    saveSettings: useMutation({ mutationFn: (b: UpsertAttendanceSettingRequest) => api.putWorkspaceAttendanceSettings(ws, b), onSuccess: () => qc.invalidateQueries({ queryKey: qk.attSettings(ws) }) }),
    saveWorkWeek: useMutation({ mutationFn: (b: UpsertWorkWeekRequest) => api.putWorkspaceWorkWeek(ws, b), onSuccess: () => qc.invalidateQueries({ queryKey: qk.workWeek(ws) }) }),
    saveMyWorkWeek: useMutation({ mutationFn: (b: UpsertWorkWeekRequest) => api.putWorkspaceWorkWeekMe(ws, b), onSuccess: () => qc.invalidateQueries({ queryKey: qk.myWorkWeek(ws) }) }),
    saveMyDailyReport: useMutation({ mutationFn: (b: UpsertDailyReportRequest) => api.putWorkspaceDailyReportsMe(ws, b), onSuccess: refreshReports }),
    upsertSession: useMutation({ mutationFn: (b: UpsertAttendanceSessionRequest) => api.postWorkspaceAttendanceSessions(ws, b), onSuccess: refreshAtt }),
    deleteRecord: useMutation({ mutationFn: (id: string) => api.deleteWorkspaceAttendanceRecord(ws, id), onSuccess: refreshAtt }),
  };
}
