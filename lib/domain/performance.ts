import type { InitiativeStatus } from "../api/schema";

export const INITIATIVE_STATUSES: InitiativeStatus[] = ["proposed", "in_progress", "accepted", "rejected"];
export const INITIATIVE_LABEL: Record<InitiativeStatus, string> = { proposed: "Đề xuất", in_progress: "Đang thực hiện", accepted: "Đã chấp nhận", rejected: "Từ chối" };
export const INITIATIVE_TONE: Record<InitiativeStatus, "neutral" | "accent" | "success" | "danger"> = { proposed: "neutral", in_progress: "accent", accepted: "success", rejected: "danger" };
