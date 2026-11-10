import type { FeedbackResponse, InitiativeResponse, LateLogResponse } from "@/lib/api/schema";
import { getWorkspaceFeedbacks, getWorkspaceInitiatives, getWorkspaceLateLogs } from "@/lib/api/endpoints";
import { fetchAll } from "@/lib/query/paged";

export interface KpiMemberRecords {
  feedbacks: FeedbackResponse[];
  initiatives: InitiativeResponse[];
  lateLogs: LateLogResponse[];
}

export type KpiRecordsByMember = Map<string, KpiMemberRecords>;

function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01T00:00:00+07:00`, to: `${month}-${String(last).padStart(2, "0")}T23:59:59+07:00` };
}

export async function fetchKpiRecords(workspaceId: string, month: string, memberId?: string): Promise<KpiRecordsByMember> {
  const { from, to } = monthRange(month);
  const [feedbacks, initiatives, lateLogs] = await Promise.all([
    fetchAll<FeedbackResponse>((p) => getWorkspaceFeedbacks(workspaceId, { ...p, from, to, memberId })),
    fetchAll<InitiativeResponse>((p) => getWorkspaceInitiatives(workspaceId, { ...p, to, refMemberId: memberId })),
    fetchAll<LateLogResponse>((p) => getWorkspaceLateLogs(workspaceId, { ...p, from, to, lateUserId: memberId })),
  ]);

  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);
  const out: KpiRecordsByMember = new Map();
  const bucket = (id: string) => {
    let b = out.get(id);
    if (!b) out.set(id, (b = { feedbacks: [], initiatives: [], lateLogs: [] }));
    return b;
  };

  for (const f of feedbacks) for (const b of f.beneficiaries ?? []) bucket(b.id).feedbacks.push(f);
  for (const i of initiatives) {
    const at = i.approvedAt ? Date.parse(i.approvedAt) : NaN;
    if (at >= fromMs && at <= toMs) bucket(i.refMember.id).initiatives.push(i);
  }
  for (const l of lateLogs) bucket(l.lateUser.id).lateLogs.push(l);

  const byTime = <T>(get: (x: T) => string | undefined) => (a: T, b: T) => Date.parse(get(a) ?? "") - Date.parse(get(b) ?? "");
  for (const r of out.values()) {
    r.feedbacks.sort(byTime((x) => x.createdAt));
    r.initiatives.sort(byTime((x) => x.approvedAt));
    r.lateLogs.sort(byTime((x) => x.lateTime));
  }
  return out;
}

const VN = "Asia/Ho_Chi_Minh";
const fmtDay = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", timeZone: VN }) : "");
const fmtDayTime = (iso: string) =>
  `${fmtDay(iso)} ${new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: VN })}`;
const signed = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n * 10) / 10}`;

/** Mỗi bản ghi một dòng "dd/MM — nội dung (điểm)" cho ô Ghi chú. Log muộn cộng vào điểm trừ nên hiện dấu âm. */
export const feedbackLines = (list: FeedbackResponse[]) =>
  list.map((f) => `${fmtDay(f.createdAt)} — ${f.content}${f.feedbackText ? `: “${f.feedbackText}”` : ""} (${signed(f.estimate)})`);

export const initiativeLines = (list: InitiativeResponse[]) =>
  list.map((i) => `${fmtDay(i.approvedAt)} — ${i.content} (${signed(i.estimate)})`);

export const lateLogLines = (list: LateLogResponse[]) =>
  list.map((l) => `${fmtDayTime(l.lateTime)} — ${l.content} (${signed(-l.estimate)})`);
