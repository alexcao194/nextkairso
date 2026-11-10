import type { MeetingItem, MeetingMinutesResponse, MeetingParticipant, TaskResponse } from "../api/schema";
import { fmtDate } from "./format";
import { localDateKey } from "./task";

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
    label: "Hạng mục đã triển khai",
    hint: "Việc đã làm xong — đánh dấu khi đã cập nhật lên hệ thống.",
    contentLabel: "Nội dung",
    status: ["Chờ cập nhật", "Đã cập nhật"],
    tasks: false,
  },
  planned: {
    label: "Hạng mục cần triển khai",
    hint: "Việc sẽ làm — tạo task để có người phụ trách và hạn.",
    contentLabel: "Nội dung yêu cầu",
    status: null,
    tasks: true,
  },
  backlog: {
    label: "Backlog",
    hint: "Ghi nhận, chưa lên kế hoạch.",
    contentLabel: "Nội dung yêu cầu",
    status: null,
    tasks: true,
  },
};

export function sectionTitle(s: MeetingSection, rows: MeetingItem[]): string {
  if (s === "deployed" && rows.length && rows.every((r) => r.status !== "done")) return "Hạng mục đã triển khai, chờ cập nhật";
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
  if (dep.length) parts.push(`${dep.length} đã triển khai`);
  const pl = count("planned");
  if (pl.length) {
    const pri = pl.filter((i) => i.priority).length;
    parts.push(`${pl.length} cần triển khai${pri ? ` (${pri} ưu tiên)` : ""}`);
  }
  const bl = count("backlog");
  if (bl.length) parts.push(`${bl.length} backlog`);
  return parts.join(" · ") || "Chưa có nội dung";
}

export function meetingLead(m: Pick<MeetingMinutesResponse, "items">): string {
  const items = (m.items ?? []).filter((i) => i.content.trim());
  if (!items.length) return "";
  const n = (s: MeetingSection) => items.filter((i) => i.section === s).length;
  const modules = new Set(items.map((i) => i.module.trim().toLowerCase()).filter(Boolean)).size;
  const parts: string[] = [];
  if (n("deployed")) parts.push(`rà soát ${n("deployed")} hạng mục đã triển khai`);
  if (n("planned")) parts.push(`ghi nhận ${n("planned")} hạng mục cần triển khai`);
  if (n("backlog")) parts.push(`${n("backlog")} hạng mục backlog`);
  const joined = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} và ${parts[parts.length - 1]}` : parts[0];
  return `Cuộc họp ${joined}${modules ? ` trên ${modules} phân hệ` : ""}.`;
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
    ["Thời gian", fmtDate(m.meetingDate)],
    ["Địa điểm / hình thức", m.location],
    ["Thành phần tham dự", participantNames(m.attendees)],
    ["Người ghi biên bản", participantNames(m.recorders)],
  ];
  for (const [k, v] of head) if (v) out.push(`- **${k}:** ${v}`);
  const lead = meetingLead(m);
  if (lead) out.push("", lead);
  if (m.summary) out.push("", `**Nội dung:** ${m.summary}`);
  for (const s of SECTION_ORDER) {
    const meta = SECTION_META[s];
    const rows = (m.items ?? []).filter((i) => i.section === s);
    const note = m.sectionNotes?.[s];
    if (!rows.length && !note) continue;
    out.push("", `## ${sectionTitle(s, rows)}`, "");
    if (rows.length) {
      const cols: Array<[string, (i: MeetingItem) => string]> = [
        ["STT", () => ""],
        ["Phân hệ", (i) => i.module],
        [meta.contentLabel, (i) => [i.content, i.note].filter(Boolean).join(" — ")],
      ];
      if (meta.tasks) cols.push(["Ưu tiên", (i) => (i.priority ? "Ưu tiên" : "")], ["Task", (i) => (i.tasks ?? []).map((t) => t.code).join(", ")]);
      if (meta.status) cols.push(["Trạng thái", (i) => meta.status![i.status === "done" ? 1 : 0]]);
      out.push(`| ${cols.map((c) => c[0]).join(" | ")} |`, `| ${cols.map(() => "---").join(" | ")} |`);
      rows.forEach((r, idx) => out.push(`| ${cols.map((c, ci) => (ci === 0 ? String(idx + 1) : cell(c[1](r)))).join(" | ")} |`));
    }
    if (note) out.push("", `> **Ghi chú:** ${note}`);
  }
  return out.join("\n");
}
