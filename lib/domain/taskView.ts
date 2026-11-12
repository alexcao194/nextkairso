import type { TaskResponse } from "../api/schema";
import { STATUS_META, TASK_STATUSES, priorityLevel, PRIORITY_META } from "./task";
import { tr } from "../i18n/dict";
import { liveLabels } from "../i18n/live";

export interface TaskView {
  q: string;
  status: string[];
  priority: string[];
  module: string[];
  worker: string[];
  label: string[];
  group: GroupBy;
  sort: SortRule[];
  archived: "active" | "archived" | "all";
}

export type GroupBy = "status" | "priority" | "module" | "assignee" | "none";
export type SortField = "title" | "status" | "priority" | "estimation" | "module" | "returnCount" | "startDate" | "endDate";
export interface SortRule {
  field: SortField;
  dir: "asc" | "desc";
}

const DEFAULT_SORT: SortRule[] = [
  { field: "status", dir: "asc" },
  { field: "endDate", dir: "desc" },
];

export const SORT_LABEL: Record<SortField, string> = liveLabels(() => tr().sort);

export const GROUP_LABEL: Record<GroupBy, string> = liveLabels(() => tr().group);

const csv = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

function parseSort(raw: string | null): SortRule[] {
  if (!raw) return DEFAULT_SORT;
  const rules = raw
    .split(",")
    .map((s) => s.split(":"))
    .filter(([f]) => f in SORT_LABEL)
    .map(([f, d]) => ({ field: f as SortField, dir: d === "desc" ? ("desc" as const) : ("asc" as const) }));
  return rules.length ? rules : DEFAULT_SORT;
}
export const serializeSort = (rules: SortRule[]) => rules.map((r) => `${r.field}:${r.dir}`).join(",");

export function parseView(sp: URLSearchParams): TaskView {
  const g = sp.get("group") as GroupBy | null;
  const a = sp.get("archived");
  return {
    q: sp.get("q") ?? "",
    status: csv(sp.get("status")),
    priority: csv(sp.get("priority")),
    module: csv(sp.get("module")),
    worker: csv(sp.get("worker")),
    label: csv(sp.get("label")),
    group: g && g in GROUP_LABEL ? g : "status",
    sort: parseSort(sp.get("sort")),
    archived: a === "all" || a === "archived" ? a : "active",
  };
}

export const activeFilterCount = (v: TaskView) =>
  [v.status, v.priority, v.module, v.worker, v.label].filter((l) => l.length).length + (v.archived !== "active" ? 1 : 0);

export function filterTasks(tasks: TaskResponse[], v: TaskView): TaskResponse[] {
  const q = v.q.trim().toLowerCase();
  return tasks.filter((t) => {
    if (q && !`${t.title} ${t.code}`.toLowerCase().includes(q)) return false;
    if (v.status.length && !v.status.includes(t.status)) return false;
    if (v.priority.length && !v.priority.includes(String(t.priority))) return false;
    if (v.module.length && !v.module.includes(t.moduleId ?? "none")) return false;
    if (v.worker.length) {
      const ids = (t.workers ?? []).map((w) => w.user.id);
      if (!v.worker.some((w) => (w === "none" ? ids.length === 0 : ids.includes(w)))) return false;
    }
    if (v.label.length && !(t.labels ?? []).some((l) => v.label.includes(l.id))) return false;
    if (v.archived === "active" && t.archived) return false;
    if (v.archived === "archived" && !t.archived) return false;
    return true;
  });
}

function cmp(a: TaskResponse, b: TaskResponse, r: SortRule, moduleName: (id?: string) => string): number {
  const dir = r.dir === "asc" ? 1 : -1;
  const val = (t: TaskResponse): string | number | undefined => {
    switch (r.field) {
      case "title": return t.title.toLowerCase();
      case "status": return TASK_STATUSES.indexOf(t.status);
      case "priority": return t.priority ? 5 - t.priority : undefined;
      case "estimation": return t.estimation;
      case "module": return t.moduleId ? moduleName(t.moduleId).toLowerCase() : undefined;
      case "returnCount": return t.returnCount;
      case "startDate": return t.startDate ? new Date(t.startDate).getTime() : undefined;
      case "endDate": return t.endDate ? new Date(t.endDate).getTime() : undefined;
    }
  };
  const x = val(a);
  const y = val(b);
  if (x === undefined && y === undefined) return 0;
  if (x === undefined) return 1;
  if (y === undefined) return -1;
  return x < y ? -dir : x > y ? dir : 0;
}

export function sortTasks(tasks: TaskResponse[], rules: SortRule[], moduleName: (id?: string) => string): TaskResponse[] {
  return [...tasks].sort((a, b) => {
    for (const r of rules) {
      const c = cmp(a, b, r, moduleName);
      if (c) return c;
    }
    return a.sequenceNo - b.sequenceNo;
  });
}

export interface TaskGroup {
  key: string;
  label: string;
  dot?: string;
  tasks: TaskResponse[];
}

export function groupTasks(
  tasks: TaskResponse[],
  by: GroupBy,
  ctx: { moduleName: (id?: string) => string; memberName: (id: string) => string },
): TaskGroup[] {
  if (by === "none") return [{ key: "all", label: tr().groupLabel.allTasks, tasks }];
  const map = new Map<string, TaskGroup>();
  const ensure = (key: string, label: string, dot?: string) => {
    if (!map.has(key)) map.set(key, { key, label, dot, tasks: [] });
    return map.get(key)!;
  };
  if (by === "status") TASK_STATUSES.forEach((s) => ensure(s, STATUS_META[s].label, STATUS_META[s].dot));
  for (const t of tasks) {
    if (by === "status") ensure(t.status, STATUS_META[t.status].label, STATUS_META[t.status].dot).tasks.push(t);
    else if (by === "priority") {
      const l = priorityLevel(t.priority);
      ensure(l === null ? "none" : String(l), l === null ? tr().groupLabel.noPriority : `${PRIORITY_META[l].tag} · ${PRIORITY_META[l].label}`, l === null ? undefined : PRIORITY_META[l].color).tasks.push(t);
    } else if (by === "module") {
      ensure(t.moduleId ?? "none", t.moduleId ? ctx.moduleName(t.moduleId) : tr().groupLabel.noModule).tasks.push(t);
    } else {
      const ws = t.workers ?? [];
      if (ws.length === 0) ensure("none", tr().groupLabel.unassigned).tasks.push(t);
      else for (const w of ws) ensure(w.user.id, ctx.memberName(w.user.id) || w.user.name).tasks.push(t);
    }
  }
  const out = [...map.values()];
  if (by === "priority") out.sort((a, b) => (a.key === "none" ? 4 : Number(a.key)) - (b.key === "none" ? 4 : Number(b.key)));
  return by === "status" ? out : out.filter((g) => g.tasks.length > 0);
}

export type ColumnKey =
  | "code" | "title" | "status" | "priority" | "module" | "workers" | "due" | "estimate"
  | "alert" | "feedback" | "comments" | "labels" | "faultHolders" | "project" | "start" | "returnCount";

export const DEFAULT_COLUMNS: ColumnKey[] = ["code", "title", "status", "priority", "module", "workers", "due", "estimate"];

export const COLUMN_META: Record<ColumnKey, { label: string; width: string; locked?: boolean }> = {
  code: { get label() { return tr().column.code; }, width: "84px", locked: true },
  title: { get label() { return tr().column.title; }, width: "minmax(220px,1fr)", locked: true },
  status: { get label() { return tr().column.status; }, width: "116px" },
  priority: { get label() { return tr().column.priority; }, width: "92px" },
  module: { get label() { return tr().column.module; }, width: "120px" },
  workers: { get label() { return tr().column.workers; }, width: "96px" },
  due: { get label() { return tr().column.due; }, width: "76px" },
  estimate: { get label() { return tr().column.estimate; }, width: "72px" },
  alert: { get label() { return tr().column.alert; }, width: "70px" },
  feedback: { get label() { return tr().column.feedback; }, width: "80px" },
  comments: { get label() { return tr().column.comments; }, width: "84px" },
  labels: { get label() { return tr().column.labels; }, width: "160px" },
  faultHolders: { get label() { return tr().column.faultHolders; }, width: "110px" },
  project: { get label() { return tr().column.project; }, width: "130px" },
  start: { get label() { return tr().column.start; }, width: "76px" },
  returnCount: { get label() { return tr().column.returnCount; }, width: "70px" },
};

export const COLUMN_ORDER: ColumnKey[] = [
  "code", "title", "project", "status", "priority", "module", "labels", "workers", "faultHolders", "start", "due", "estimate", "returnCount", "alert", "feedback", "comments",
];
