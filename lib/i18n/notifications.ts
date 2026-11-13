// Client mirror of the server notification catalog (internal/i18n in gokairso).
// Notifications are stored with a `type` + params in `data`; we render them in
// the reader's current language here, falling back to the server-rendered
// title/body (default locale) when a type is unknown.
import type { Lang } from "./index";

type Tmpl = { title: string; body: string };

const ROLE_WS: Record<Lang, Record<string, string>> = {
  vi: { holder: "chủ workspace", admin: "quản trị viên", member: "thành viên" },
  en: { holder: "owner", admin: "admin", member: "member" },
};
const ROLE_PROJECT: Record<Lang, Record<string, string>> = {
  vi: { holder: "chủ dự án", admin: "quản trị viên", member: "thành viên" },
  en: { holder: "owner", admin: "admin", member: "member" },
};
const TASK_STATUS: Record<Lang, Record<string, string>> = {
  vi: { backlog: "Backlog", todo: "Cần làm", in_progress: "Đang làm", review: "Chờ duyệt", done: "Hoàn thành", canceled: "Đã huỷ" },
  en: { backlog: "Backlog", todo: "To do", in_progress: "In progress", review: "In review", done: "Done", canceled: "Canceled" },
};

const CATALOG: Record<Lang, Record<string, Tmpl>> = {
  vi: {
    work_schedule_registration: { title: "Đăng ký lịch làm việc", body: "{registrant} đã đăng ký lịch làm việc từ {fromDate} đến {toDate}" },
    work_schedule_approved: { title: "Lịch làm việc đã được duyệt", body: "Lịch làm việc từ {fromDate} đến {toDate} của bạn đã được duyệt." },
    work_schedule_rejected: { title: "Lịch làm việc bị từ chối", body: "Lịch làm việc từ {fromDate} đến {toDate} của bạn bị từ chối." },
    daily_report_reminder: { title: "Nhắc nộp báo cáo cuối ngày", body: "Bạn sắp hết giờ làm hôm nay mà chưa nộp báo cáo cuối ngày. Hãy điền báo cáo khi check-out." },
    attendance_check_in_reminder: { title: "Nhắc chấm công", body: "Ca làm việc của bạn bắt đầu lúc {sessionTime}. Hãy check-in." },
    attendance_check_out_reminder: { title: "Nhắc chấm công", body: "Ca làm việc của bạn kết thúc lúc {sessionTime}. Hãy check-out." },
    attendance_correction_request_submitted: { title: "Yêu cầu bổ sung công", body: "{requester} đã gửi yêu cầu bổ sung công: {session}" },
    attendance_correction_request_approved: { title: "Yêu cầu bổ sung công đã được duyệt", body: "Yêu cầu bổ sung công ({session}) của bạn đã được duyệt." },
    attendance_correction_request_rejected: { title: "Yêu cầu bổ sung công bị từ chối", body: "Yêu cầu bổ sung công ({session}) của bạn bị từ chối." },

    workspace_invitation: { title: "Lời mời vào workspace", body: "{actor} đã mời bạn vào {workspaceName} với vai trò {role}" },
    workspace_member_role_updated: { title: "Vai trò trong workspace đã thay đổi", body: "Vai trò của bạn trong {workspaceName} đã được đổi thành {role}" },
    workspace_member_removed: { title: "Bạn đã bị xoá khỏi workspace", body: "Bạn đã bị xoá khỏi {workspaceName}" },
    workspace_updated: { title: "Workspace có cập nhật", body: "Một workspace đã thay đổi" },

    project_member_added: { title: "Bạn được thêm vào dự án", body: "Bạn đã được thêm vào {projectName} với vai trò {role}" },
    project_member_role_updated: { title: "Vai trò trong dự án đã thay đổi", body: "Vai trò của bạn trong {projectName} đã được đổi thành {role}" },
    project_member_removed: { title: "Bạn đã bị xoá khỏi dự án", body: "Bạn đã bị xoá khỏi {projectName}" },
    project_updated: { title: "Dự án có cập nhật", body: "Một dự án đã thay đổi" },

    task_assigned: { title: "Bạn được giao task", body: "{caller} đã giao task \"{taskTitle}\" cho bạn" },
    task_unassigned: { title: "Bạn được gỡ khỏi task", body: "{caller} đã gỡ bạn khỏi task \"{taskTitle}\"" },
    task_status_updated: { title: "Trạng thái task đã thay đổi", body: "{caller} đã chuyển \"{taskTitle}\" sang trạng thái {status}" },
    task_fault_holder_assigned: { title: "Task được trả lại cho bạn", body: "{caller} đã chỉ định bạn chịu lỗi cho task \"{taskTitle}\"" },
    task_fault_holder_unassigned: { title: "Bạn không còn chịu lỗi task", body: "{caller} đã gỡ bạn khỏi vai trò chịu lỗi của task \"{taskTitle}\"" },
    task_deadline_reminder: { title: "Task sắp đến hạn", body: "Task \"{taskTitle}\" đến hạn vào {dueAt}" },
    task_comment_added: { title: "Bình luận mới", body: "{caller} đã bình luận trong \"{taskTitle}\": {snippet}" },
    task_mentioned: { title: "Bạn được nhắc đến", body: "{caller} đã nhắc đến bạn trong \"{taskTitle}\": {snippet}" },
    task_updated: { title: "Task có cập nhật", body: "Task \"{taskTitle}\" đã được cập nhật" },

    initiative_created: { title: "Có sáng kiến mới", body: "Một sáng kiến mới vừa được gửi để xem xét" },
    late_log_created: { title: "Có ghi nhận đi muộn mới", body: "Một ghi nhận đi muộn mới vừa được thêm" },
    customer_feedback_created: { title: "Có feedback khách hàng mới", body: "Một feedback khách hàng mới vừa được thêm" },
    workspace_performance_updated: { title: "Cập nhật hiệu suất workspace", body: "Một bản ghi hiệu suất workspace vừa được tạo" },
  },
  en: {
    work_schedule_registration: { title: "Work schedule registered", body: "{registrant} registered a work schedule from {fromDate} to {toDate}" },
    work_schedule_approved: { title: "Work schedule approved", body: "Your work schedule from {fromDate} to {toDate} was approved." },
    work_schedule_rejected: { title: "Work schedule rejected", body: "Your work schedule from {fromDate} to {toDate} was rejected." },
    daily_report_reminder: { title: "End-of-day report reminder", body: "Your working hours are almost over and you haven't submitted your end-of-day report. Please fill it in when you check out." },
    attendance_check_in_reminder: { title: "Attendance reminder", body: "Your shift starts at {sessionTime}. Please check in." },
    attendance_check_out_reminder: { title: "Attendance reminder", body: "Your shift ends at {sessionTime}. Please check out." },
    attendance_correction_request_submitted: { title: "Attendance correction request", body: "{requester} submitted an attendance correction request: {session}" },
    attendance_correction_request_approved: { title: "Attendance correction approved", body: "Your attendance correction request ({session}) was approved." },
    attendance_correction_request_rejected: { title: "Attendance correction rejected", body: "Your attendance correction request ({session}) was rejected." },

    workspace_invitation: { title: "Workspace invitation", body: "{actor} invited you to {workspaceName} as {role}" },
    workspace_member_role_updated: { title: "Workspace role changed", body: "Your role in {workspaceName} was changed to {role}" },
    workspace_member_removed: { title: "Removed from workspace", body: "You were removed from {workspaceName}" },
    workspace_updated: { title: "Workspace updated", body: "A workspace has changed" },

    project_member_added: { title: "Added to a project", body: "You were added to {projectName} as {role}" },
    project_member_role_updated: { title: "Project role changed", body: "Your role in {projectName} was changed to {role}" },
    project_member_removed: { title: "Removed from project", body: "You were removed from {projectName}" },
    project_updated: { title: "Project updated", body: "A project has changed" },

    task_assigned: { title: "Task assigned to you", body: "{caller} assigned the task \"{taskTitle}\" to you" },
    task_unassigned: { title: "Removed from a task", body: "{caller} removed you from the task \"{taskTitle}\"" },
    task_status_updated: { title: "Task status changed", body: "{caller} moved \"{taskTitle}\" to {status}" },
    task_fault_holder_assigned: { title: "Task returned to you", body: "{caller} assigned you as the fault holder for \"{taskTitle}\"" },
    task_fault_holder_unassigned: { title: "No longer the fault holder", body: "{caller} removed you as the fault holder for \"{taskTitle}\"" },
    task_deadline_reminder: { title: "Task due soon", body: "Task \"{taskTitle}\" is due at {dueAt}" },
    task_comment_added: { title: "New comment", body: "{caller} commented on \"{taskTitle}\": {snippet}" },
    task_mentioned: { title: "You were mentioned", body: "{caller} mentioned you in \"{taskTitle}\": {snippet}" },
    task_updated: { title: "Task updated", body: "Task \"{taskTitle}\" was updated" },

    initiative_created: { title: "New initiative", body: "A new initiative was submitted for review" },
    late_log_created: { title: "New late arrival log", body: "A new late arrival log was added" },
    customer_feedback_created: { title: "New customer feedback", body: "New customer feedback was added" },
    workspace_performance_updated: { title: "Workspace performance updated", body: "A workspace performance record was created" },
  },
};

function apply(s: string, p: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in p ? p[k] : `{${k}}`));
}

/**
 * Render a notification's title/body in `lang` from its `data` (type + params).
 * Falls back to the server-provided `fallback` (default-locale title/body).
 */
export function renderNotification(
  lang: Lang,
  data: Record<string, string> | undefined,
  fallback: { title: string; body: string },
): { title: string; body: string } {
  const d = data ?? {};
  let key = d.type ?? "";
  if (d.mentioned === "true" && key === "task_comment_added") key = "task_mentioned";
  const tmpl = CATALOG[lang][key];
  if (!tmpl) return fallback;
  const params: Record<string, string> = { ...d };
  if (d.role) {
    params.role = (key.startsWith("project_") ? ROLE_PROJECT : ROLE_WS)[lang][d.role] ?? d.role;
  }
  if (d.status) params.status = TASK_STATUS[lang][d.status] ?? d.status;
  // Notifications stored before params were recorded (or sent by an older
  // server) lack some fields: show the server's own text instead of "{name}".
  const needed = [...`${tmpl.title} ${tmpl.body}`.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  if (needed.some((k) => !params[k])) return fallback;
  return { title: apply(tmpl.title, params), body: apply(tmpl.body, params) };
}
