import type { FeedbackStatus, FeedbackType } from "../api/schema";
import { tr } from "../i18n/dict";
import { liveLabels } from "../i18n/live";

export const FEEDBACK_STATUSES: FeedbackStatus[] = ["pending", "discussing", "acknowledged", "in_progress", "resolved", "deployed", "canceled"];
export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = liveLabels(() => tr().feedbackStatus);
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
export const FEEDBACK_TYPE_LABEL: Record<FeedbackType, string> = liveLabels(() => tr().feedbackType);
export const FEEDBACK_TYPE_TONE: Record<FeedbackType, "accent" | "neutral" | "danger"> = { feature: "accent", improvement: "neutral", bug: "danger" };
