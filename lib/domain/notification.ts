import type { NotificationResponse } from "../api/schema";
import type { Hue } from "./hue";

export function notificationHref(n: Pick<NotificationResponse, "data" | "workspaceId">): string | null {
  const d = n.data ?? {};
  const ws = n.workspaceId ? `ws=${n.workspaceId}` : "";
  const withWs = (path: string) => (ws ? `${path}${path.includes("?") ? "&" : "?"}${ws}` : path);
  const projectId = d.projectId ?? "";
  const target = d.targetID ?? "";
  switch (d.type) {
    case "task_assigned":
    case "task_unassigned":
    case "task_status_updated":
    case "task_fault_holder_assigned":
    case "task_fault_holder_unassigned":
    case "task_deadline_reminder":
    case "task_comment_added":
      if (projectId && target) return withWs(`/projects/${projectId}/tasks?task=${target}`);
      return projectId ? withWs(`/projects/${projectId}/tasks`) : withWs("/");
    case "project_member_added":
    case "project_member_role_updated":
      return target ? withWs(`/projects/${target}/tasks`) : withWs("/");
    case "workspace_member_role_updated":
      return withWs("/settings/members");
    case "workspace_invitation":
    case "workspace_member_removed":
    case "project_member_removed":
      return withWs("/");
    case "initiative_created":
      return withWs("/initiatives");
    case "late_log_created":
      return withWs("/calendar?tab=late");
    case "customer_feedback_created":
      return withWs("/initiatives?tab=feedbacks");
    case "work_schedule_registration":
      return d.memberId ? withWs(`/calendar?tab=pending&member=${d.memberId}`) : withWs("/calendar?tab=pending");
    case "attendance_check_in_reminder":
    case "attendance_check_out_reminder":
    case "work_schedule_approved":
    case "work_schedule_rejected":
    case "attendance_correction_request_approved":
    case "attendance_correction_request_rejected":
      return withWs("/calendar");
    case "attendance_correction_request_submitted":
      return withWs("/calendar?tab=requests");
    default:
      return null;
  }
}

export type NotificationKind = "task" | "comment" | "approval" | "attendance" | "member" | "feedback" | "other";

export function notificationKind(type?: string): NotificationKind {
  if (!type) return "other";
  if (type === "task_comment_added") return "comment";
  if (type.startsWith("task_")) return "task";
  if (type.startsWith("attendance") || type.startsWith("work_schedule") || type === "late_log_created") return "attendance";
  if (type.includes("member") || type === "workspace_invitation") return "member";
  if (type.includes("feedback") || type === "initiative_created") return "feedback";
  return "other";
}

export const KIND_LABEL: Record<NotificationKind, string> = {
  task: "Task",
  comment: "Bình luận",
  approval: "Phê duyệt",
  attendance: "Chấm công",
  member: "Thành viên",
  feedback: "Phản hồi",
  other: "Thông báo",
};

export const KIND_HUE: Record<string, Hue> = {
  task: "blue",
  comment: "cyan",
  approval: "violet",
  attendance: "teal",
  member: "green",
  feedback: "pink",
  other: "blue",
  overdue: "rose",
  due: "orange",
};
