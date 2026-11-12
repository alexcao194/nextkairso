import type { MeetingItem, MeetingMinutesResponse, MeetingParticipant, TaskResponse } from "../api/schema";
import { fmtDate } from "./format";
import { localDateKey } from "./task";
import { tr } from "../i18n/dict";

export type MeetingSection = MeetingItem["section"];

interface SectionMeta {
  label: string;
  hint: string;
  contentLabel: string;
  status: [string, string] | null;
  tasks: boolean;
}

export const SECTION_ORDER: MeetingSection[] = ["deployed", "planned", "backlog"];

export const SECTION_META: Record<MeetingSection, SectionMeta> = {
  deployed: {
    get label() { return tr().meeting.deployed; },
    get hint() { return tr().meeting.deployedHint; },
    get contentLabel() { return tr().meeting.content; },
    get status(): [string, string] { return [tr().meeting.awaitingUpdate, tr().meeting.updated]; },
    tasks: false,
  },
  planned: {
    get label() { return tr().meeting.planned; },
    get hint() { return tr().meeting.plannedHint; },
    get contentLabel() { return tr().meeting.requestContent; },
    status: null,
    tasks: true,
  },
  backlog: {
    get label() { return tr().meeting.backlog; },
    get hint() { return tr().meeting.backlogHint; },
    get contentLabel() { return tr().meeting.requestContent; },
    status: null,
    tasks: true,
  },
};

export function sectionTitle(s: MeetingSection, rows: MeetingItem[]): string {
  if (s === "deployed" && rows.length && rows.every((r) => r.status !== "done")) return tr().meeting.deployedPending;
  return SECTION_META[s].label;
}

export function newMeetingItem(section: MeetingSection): MeetingItem {
  return { id: crypto.randomUUID(), section, module: "", content: "", priority: false, status: "open", note: "", tasks: [] };
}

export const isBlankItem = (it: MeetingItem) => !it.content.trim() && !it.module.trim() && !it.note.trim() && !(it.tasks ?? []).length;

export const toDateInput = (v?: string) => (v ? v.slice(0, 10) : "");

export const todayKey = () => localDateKey();

export const participantNames = (ps?: MeetingParticipant[]) => (ps ?? []).map((p) => p.name).join(" + ");

export function meetingSummary(m: Pick<MeetingMinutesResponse, "items">): string {
  const items = m.items ?? [];
  const count = (s: MeetingSection) => items.filter((i) => i.section === s);
  const parts: string[] = [];
  const dep = count("deployed");
  if (dep.length) parts.push(tr().meeting.sumDeployed(dep.length));
  const pl = count("planned");
  if (pl.length) {
    const pri = pl.filter((i) => i.priority).length;
    parts.push(tr().meeting.sumPlanned(pl.length, pri));
  }
  const bl = count("backlog");
  if (bl.length) parts.push(tr().meeting.sumBacklog(bl.length));
  return parts.join(" · ") || tr().meeting.empty;
}

export function meetingLead(m: Pick<MeetingMinutesResponse, "items">): string {
  const items = (m.items ?? []).filter((i) => i.content.trim());
  if (!items.length) return "";
  const n = (s: MeetingSection) => items.filter((i) => i.section === s).length;
  const modules = new Set(items.map((i) => i.module.trim().toLowerCase()).filter(Boolean)).size;
  const parts: string[] = [];
  if (n("deployed")) parts.push(tr().meeting.leadDeployed(n("deployed")));
  if (n("planned")) parts.push(tr().meeting.leadPlanned(n("planned")));
  if (n("backlog")) parts.push(tr().meeting.leadBacklog(n("backlog")));
  const joined = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} ${tr().meeting.and} ${parts[parts.length - 1]}` : parts[0];
  return tr().meeting.lead(joined, modules);
}

export function itemAssignment(tasks: Array<TaskResponse | undefined>): { owners: string[]; due?: string } {
  const owners = new Set<string>();
  let due: string | undefined;
  for (const t of tasks) {
    if (!t) continue;
    for (const w of t.workers ?? []) owners.add(w.user.name);
    if (t.endDate && (!due || t.endDate > due)) due = t.endDate;
  }
  return { owners: [...owners], due };
}

const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n+/g, " ");

export function meetingToMarkdown(m: Pick<MeetingMinutesResponse, "title" | "meetingDate" | "location" | "attendees" | "recorders" | "summary" | "items" | "sectionNotes">): string {
  const out: string[] = [`# ${m.title}`, ""];
  const head: Array<[string, string]> = [
    [tr().meeting.time, fmtDate(m.meetingDate)],
    [tr().meeting.location, m.location],
    [tr().meeting.attendees, participantNames(m.attendees)],
    [tr().meeting.recorders, participantNames(m.recorders)],
  ];
  for (const [k, v] of head) if (v) out.push(`- **${k}:** ${v}`);
  const lead = meetingLead(m);
  if (lead) out.push("", lead);
  if (m.summary) out.push("", `**${tr().meeting.summary}:** ${m.summary}`);
  for (const s of SECTION_ORDER) {
    const meta = SECTION_META[s];
    const rows = (m.items ?? []).filter((i) => i.section === s);
    const note = m.sectionNotes?.[s];
    if (!rows.length && !note) continue;
    out.push("", `## ${sectionTitle(s, rows)}`, "");
    if (rows.length) {
      const cols: Array<[string, (i: MeetingItem) => string]> = [
        [tr().meeting.no, () => ""],
        [tr().meeting.module, (i) => i.module],
        [meta.contentLabel, (i) => [i.content, i.note].filter(Boolean).join(" — ")],
      ];
      if (meta.tasks) cols.push([tr().meeting.priority, (i) => (i.priority ? tr().meeting.priority : "")], ["Task", (i) => (i.tasks ?? []).map((t) => t.code).join(", ")]);
      if (meta.status) cols.push([tr().meeting.status, (i) => meta.status![i.status === "done" ? 1 : 0]]);
      out.push(`| ${cols.map((c) => c[0]).join(" | ")} |`, `| ${cols.map(() => "---").join(" | ")} |`);
      rows.forEach((r, idx) => out.push(`| ${cols.map((c, ci) => (ci === 0 ? String(idx + 1) : cell(c[1](r)))).join(" | ")} |`));
    }
    if (note) out.push("", `> **${tr().meeting.note}:** ${note}`);
  }
  return out.join("\n");
}
