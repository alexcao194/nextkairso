import type { TaskStatsTotalsResponse } from "@/lib/api/schema";
import { PRIORITY_META } from "@/lib/domain/task";
import type { Segment } from "./StackedBar";

export const prioritySegments = (t: Pick<TaskStatsTotalsResponse, "priority4" | "priority3" | "priority2" | "priority1">): Segment[] => [
  { key: "p0", label: `${PRIORITY_META[0].tag} ${PRIORITY_META[0].label}`, value: t.priority4, color: PRIORITY_META[0].color },
  { key: "p1", label: `${PRIORITY_META[1].tag} ${PRIORITY_META[1].label}`, value: t.priority3, color: PRIORITY_META[1].color },
  { key: "p2", label: `${PRIORITY_META[2].tag} ${PRIORITY_META[2].label}`, value: t.priority2, color: PRIORITY_META[2].color },
  { key: "p3", label: `${PRIORITY_META[3].tag} ${PRIORITY_META[3].label}`, value: t.priority1, color: PRIORITY_META[3].color },
];
