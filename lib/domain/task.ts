import type { TaskStatus } from "../api/schema";

export const TASK_STATUSES: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done", "canceled"];

export const STATUS_META: Record<
  TaskStatus,
  { label: string; bg: string; fg: string; dot: string; chart: string }
> = {
  backlog: { label: "Backlog", bg: "var(--st-backlog-bg)", fg: "var(--st-backlog-fg)", dot: "var(--st-backlog-dot)", chart: "var(--chart-st-backlog)" },
  todo: { label: "Cần làm", bg: "var(--st-todo-bg)", fg: "var(--st-todo-fg)", dot: "var(--st-todo-dot)", chart: "var(--chart-st-todo)" },
  in_progress: { label: "Đang làm", bg: "var(--st-doing-bg)", fg: "var(--st-doing-fg)", dot: "var(--st-doing-dot)", chart: "var(--chart-st-doing)" },
  review: { label: "Chờ duyệt", bg: "var(--st-review-bg)", fg: "var(--st-review-fg)", dot: "var(--st-review-dot)", chart: "var(--chart-st-review)" },
  done: { label: "Hoàn thành", bg: "var(--st-done-bg)", fg: "var(--st-done-fg)", dot: "var(--st-done-dot)", chart: "var(--chart-st-done)" },
  canceled: { label: "Đã huỷ", bg: "var(--st-cancel-bg)", fg: "var(--st-cancel-fg)", dot: "var(--st-cancel-dot)", chart: "var(--chart-st-backlog)" },
};

export const isClosedStatus = (s: TaskStatus | undefined) => s === "done" || s === "canceled";

type PriorityLevel = 0 | 1 | 2 | 3;

export const PRIORITY_META: Record<
  PriorityLevel,
  { tag: string; label: string; api: number; color: string; bg: string; border: string }
> = {
  0: { tag: "P0", label: "Gấp", api: 4, color: "var(--p0)", bg: "var(--p0-bg)", border: "var(--p0-border)" },
  1: { tag: "P1", label: "Cao", api: 3, color: "var(--p1)", bg: "var(--p1-bg)", border: "var(--p1-border)" },
  2: { tag: "P2", label: "Vừa", api: 2, color: "var(--p2)", bg: "var(--p2-bg)", border: "var(--p2-border)" },
  3: { tag: "P3", label: "Thấp", api: 1, color: "var(--p3)", bg: "var(--p3-bg)", border: "var(--p3-border)" },
};

export const PRIORITY_LEVELS: PriorityLevel[] = [0, 1, 2, 3];

export function priorityLevel(api: number | null | undefined): PriorityLevel | null {
  if (!api || api < 1) return null;
  if (api >= 4) return 0;
  return (4 - api) as PriorityLevel;
}

export const priorityToApi = (level: PriorityLevel) => PRIORITY_META[level].api;

export function localDateKey(d: Date = new Date()): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isOverdue(task: { endDate?: string; status?: TaskStatus }): boolean {
  if (!task.endDate || isClosedStatus(task.status)) return false;
  return localDateKey(new Date(task.endDate)) < localDateKey();
}

export function isDueToday(task: { endDate?: string; status?: TaskStatus }): boolean {
  if (!task.endDate || isClosedStatus(task.status)) return false;
  return localDateKey(new Date(task.endDate)) === localDateKey();
}
