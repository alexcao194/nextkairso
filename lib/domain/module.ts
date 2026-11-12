import type { ModuleResponse, PublicModuleResponse } from "../api/schema";
import { localDateKey } from "./task";
import { tr } from "../i18n/dict";
import { liveLabels } from "../i18n/live";

export type ModuleStatus = ModuleResponse["status"];
export type ModuleSprint = ModuleResponse["sprints"][number];
export type SprintStatus = ModuleSprint["status"];

export const MODULE_STATUS_ORDER: ModuleStatus[] = ["backlog", "in_progress", "done", "released"];
export const MODULE_STATUS_LABEL: Record<ModuleStatus, string> = liveLabels(() => tr().moduleStatus);
export const MODULE_STATUS_COLOR: Record<ModuleStatus, string> = {
  backlog: "var(--ink-faint)",
  in_progress: "var(--blue-vivid)",
  done: "var(--green-vivid)",
  released: "var(--violet-vivid)",
};

export const SPRINT_STATUS_LABEL: Record<SprintStatus, string> = liveLabels(() => tr().sprintStatus);
export const SPRINT_STATUS_COLOR: Record<SprintStatus, string> = {
  planned: "var(--ink-faint)",
  active: "var(--blue-vivid)",
  completed: "var(--green-vivid)",
};

const MAX_SPRINT_DAYS = 31;
const DEFAULT_SPRINT_DAYS = 14;

export const nextModuleStatus = (s: ModuleStatus): ModuleStatus | null => MODULE_STATUS_ORDER[MODULE_STATUS_ORDER.indexOf(s) + 1] ?? null;

const dateOnly = (v: string) => {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (key: string, n: number) => {
  const d = dateOnly(key);
  d.setDate(d.getDate() + n);
  return localDateKey(d);
};
export const sprintDays = (s: Pick<ModuleSprint, "startDate" | "endDate">) => Math.round((dateOnly(s.endDate).getTime() - dateOnly(s.startDate).getTime()) / 86_400_000) + 1;

export const activeSprint = (m: Pick<ModuleResponse, "sprints">) => (m.sprints ?? []).find((s) => s.status === "active");

export function nextSprintDraft(m: Pick<ModuleResponse, "sprints">): { name: string; startDate: string; endDate: string } {
  const list = m.sprints ?? [];
  const last = list[list.length - 1];
  const start = last ? addDays(last.endDate, 1) : localDateKey();
  const len = last ? Math.min(sprintDays(last), MAX_SPRINT_DAYS) : DEFAULT_SPRINT_DAYS;
  return { name: `Sprint ${list.length + 1}`, startDate: start, endDate: addDays(start, len - 1) };
}

export function sprintProblem(s: Pick<ModuleSprint, "id" | "startDate" | "endDate">, all: ModuleSprint[]): string | null {
  if (!s.startDate || !s.endDate) return tr().sprint.pickDates;
  if (s.endDate < s.startDate) return tr().sprint.endBeforeStart;
  const days = sprintDays(s);
  if (days > MAX_SPRINT_DAYS) return tr().sprint.tooLong(days, MAX_SPRINT_DAYS);
  const clash = all.find((o) => o.id !== s.id && o.startDate <= s.endDate && s.startDate <= o.endDate);
  return clash ? tr().sprint.overlaps(clash.name) : null;
}

export function sprintSummary(m: Pick<ModuleResponse, "sprints">, today = localDateKey()): string {
  const a = activeSprint(m);
  if (a) {
    const left = Math.round((dateOnly(a.endDate).getTime() - dateOnly(today).getTime()) / 86_400_000);
    return `${a.name} · ${left > 0 ? tr().sprint.daysLeft(left) : left === 0 ? tr().sprint.endsToday : tr().sprint.overdueDays(-left)}`;
  }
  const next = (m.sprints ?? []).find((s) => s.status === "planned");
  if (next) return tr().sprint.startsOn(next.name, `${next.startDate.slice(8, 10)}/${next.startDate.slice(5, 7)}`);
  const n = (m.sprints ?? []).length;
  return n ? tr().sprint.doneCount(n) : tr().sprint.none;
}

export const isSprintOverdue = (s: ModuleSprint, today = localDateKey()) => s.status === "active" && s.endDate < today;

export function isReleaseOverdue(m: Pick<ModuleResponse, "endDate" | "status">): boolean {
  return !!m.endDate && m.status !== "done" && m.status !== "released" && localDateKey(new Date(m.endDate)) < localDateKey();
}

interface TimelineBar {
  start: Date;
  end: Date;
  color: string;
  label: string;
  hint?: string;
}

type TimelineModule = Pick<PublicModuleResponse, "name" | "status" | "startDate" | "endDate" | "releasedAt"> & {
  sprints: Array<{ name: string; startDate: string; endDate: string; status: SprintStatus; goal?: string }>;
};

export function moduleTimelineBars(m: TimelineModule, fmt: (d: Date) => string): TimelineBar[] {
  const bars: TimelineBar[] = m.sprints.length
    ? m.sprints.map((s) => ({
        start: dateOnly(s.startDate),
        end: dateOnly(s.endDate),
        color: SPRINT_STATUS_COLOR[s.status],
        label: s.name,
        hint: `${m.name} · ${s.name} (${SPRINT_STATUS_LABEL[s.status]}): ${fmt(dateOnly(s.startDate))} → ${fmt(dateOnly(s.endDate))}${s.goal ? ` — ${s.goal}` : ""}`,
      }))
    : m.startDate
      ? [{ start: new Date(m.startDate), end: new Date(m.endDate ?? m.startDate), color: MODULE_STATUS_COLOR[m.status as ModuleStatus], label: MODULE_STATUS_LABEL[m.status as ModuleStatus] }]
      : [];
  const release = m.status === "released" && m.releasedAt ? m.releasedAt : m.endDate;
  if (release) {
    const d = new Date(release);
    bars.push({ start: d, end: d, color: MODULE_STATUS_COLOR.released, label: tr().sprint.release, hint: `${m.name} · ${m.status === "released" ? tr().sprint.released : tr().sprint.plannedRelease} ${fmt(d)}` });
  }
  return bars;
}
