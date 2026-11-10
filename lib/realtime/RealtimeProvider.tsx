"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { resolveWsUrl } from "../config/env";
import { connId } from "../api/http";
import { getAccessToken } from "../auth/tokenManager";
import { useAuth } from "../auth/AuthContext";
import { useWorkspace } from "../workspace/WorkspaceContext";

const EVENT_ROOTS: Array<[prefix: string, roots: string[]]> = [
  ["task_label.", ["labels", "tasks", "task", "my-tasks", "threads"]],
  ["task.comment", ["task-comments", "task-history", "tasks", "task", "my-tasks", "threads", "threads-count"]],
  ["task.", ["tasks", "task", "task-history", "my-tasks", "my-tasks-count", "threads", "stats", "projects", "overviews", "modules"]],
  ["project.member", ["project-members", "members", "projects"]],
  ["project.", ["projects", "project", "overviews", "notes", "links", "files", "history"]],
  ["module.", ["modules", "module-history", "module-attachments", "overviews"]],
  ["meeting.", ["meetings"]],
  ["workspace.member", ["members", "workspaces"]],
  ["workspace.", ["workspaces", "notes", "links", "files", "history", "members"]],
  ["user.", ["me", "members"]],
  ["initiative.", ["initiatives", "kpi"]],
  ["late_log.", ["late-logs", "kpi"]],
  ["feedback.", ["feedbacks", "kpi"]],
  ["attitude.", ["kpi"]],
  ["kpi_settings.", ["kpi"]],
  ["attendance_correction_request.", ["check-requests", "att-records", "calendar"]],
  ["attendance_settings.", ["att-settings", "att-status"]],
  ["attendance.", ["att-records", "att-status", "att-stats", "calendar"]],
  ["work_schedule.", ["schedules", "calendar", "att-stats"]],
  ["work_week.", ["work-week", "schedules"]],
  ["notification.", ["notifications", "notifications-unread"]],
];

const RETRY_MS = [1000, 2000, 5000, 10000, 30000];

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { token } = useAuth();
  const { workspaceId } = useWorkspace();
  const workspaceRef = useRef(workspaceId);
  useEffect(() => {
    workspaceRef.current = workspaceId;
  }, [workspaceId]);

  useEffect(() => {
    if (!token) return;
    let ws: WebSocket | null = null;
    let closed = false;
    let attempt = 0;
    let retryTimer: number | undefined;
    let flushTimer: number | undefined;
    const pending = new Set<string>();

    const flush = () => {
      flushTimer = undefined;
      const roots = new Set(pending);
      pending.clear();
      qc.invalidateQueries({ predicate: (q) => roots.has(String(q.queryKey[0])) });
    };

    const connect = () => {
      if (closed) return;
      const access = getAccessToken();
      if (!access) return;
      try {
        ws = new WebSocket(resolveWsUrl(access, connId));
      } catch {
        return;
      }
      ws.onopen = () => {
        attempt = 0;
      };
      ws.onmessage = (msg) => {
        try {
          const ev = JSON.parse(msg.data as string) as { type?: string; workspaceId?: string };
          if (!ev.type) return;
          const current = workspaceRef.current;
          if (ev.workspaceId && current && ev.workspaceId !== current) return;
          const hit = EVENT_ROOTS.find(([prefix]) => ev.type!.startsWith(prefix));
          hit?.[1].forEach((r) => pending.add(r));
          if (hit && flushTimer === undefined) flushTimer = window.setTimeout(flush, 250);
        } catch {
          /* bỏ qua frame không phải JSON */
        }
      };
      ws.onclose = () => {
        if (closed) return;
        retryTimer = window.setTimeout(connect, RETRY_MS[Math.min(attempt++, RETRY_MS.length - 1)]);
      };
      ws.onerror = () => ws?.close();
    };

    connect();
    return () => {
      closed = true;
      window.clearTimeout(retryTimer);
      window.clearTimeout(flushTimer);
      if (!ws) return;
      ws.onmessage = ws.onerror = ws.onclose = null;
      if (ws.readyState === WebSocket.CONNECTING) {
        const pendingWs = ws;
        pendingWs.onopen = () => pendingWs.close();
      } else {
        ws.close();
      }
    };
  }, [token, qc]);

  return <>{children}</>;
}
