import type { FeedbackStatus, FeedbackType } from "../api/schema";

export const FEEDBACK_STATUSES: FeedbackStatus[] = ["pending", "discussing", "acknowledged", "in_progress", "resolved", "deployed", "canceled"];
export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  pending: "Chờ xử lý",
  discussing: "Đang trao đổi",
  acknowledged: "Đã ghi nhận",
  in_progress: "Đang xử lý",
  resolved: "Đã giải quyết",
  deployed: "Đã triển khai",
  canceled: "Đã huỷ",
};
export const FEEDBACK_STATUS_TONE: Record<FeedbackStatus, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  pending: "warning",
  discussing: "accent",
  acknowledged: "neutral",
  in_progress: "accent",
  resolved: "success",
  deployed: "success",
  canceled: "danger",
};
export const FEEDBACK_TYPES: FeedbackType[] = ["feature", "improvement", "bug"];
export const FEEDBACK_TYPE_LABEL: Record<FeedbackType, string> = { feature: "Tính năng", improvement: "Cải tiến", bug: "Lỗi" };
export const FEEDBACK_TYPE_TONE: Record<FeedbackType, "accent" | "neutral" | "danger"> = { feature: "accent", improvement: "neutral", bug: "danger" };
