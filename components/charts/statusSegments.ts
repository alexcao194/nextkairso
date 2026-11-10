import type { TaskStatsTotalsResponse } from "@/lib/api/schema";
import { STATUS_META } from "@/lib/domain/task";
import type { Segment } from "./StackedBar";

export const statusSegments = (t: Pick<TaskStatsTotalsResponse, "backlog" | "todo" | "inProgress" | "review" | "done">): Segment[] => [
  { key: "backlog", label: STATUS_META.backlog.label, value: t.backlog, color: STATUS_META.backlog.chart },
  { key: "todo", label: STATUS_META.todo.label, value: t.todo, color: STATUS_META.todo.chart },
  { key: "in_progress", label: STATUS_META.in_progress.label, value: t.inProgress, color: STATUS_META.in_progress.chart },
  { key: "review", label: STATUS_META.review.label, value: t.review, color: STATUS_META.review.chart },
  { key: "done", label: STATUS_META.done.label, value: t.done, color: STATUS_META.done.chart },
];

