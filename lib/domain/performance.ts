import type { InitiativeStatus } from "../api/schema";
import { tr } from "../i18n/dict";
import { liveLabels } from "../i18n/live";

export const INITIATIVE_STATUSES: InitiativeStatus[] = ["proposed", "in_progress", "accepted", "rejected"];
export const INITIATIVE_LABEL: Record<InitiativeStatus, string> = liveLabels(() => tr().initiativeStatus);
export const INITIATIVE_TONE: Record<InitiativeStatus, "neutral" | "accent" | "success" | "danger"> = { proposed: "neutral", in_progress: "accent", accepted: "success", rejected: "danger" };
