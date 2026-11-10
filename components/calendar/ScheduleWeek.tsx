"use client";

import { useEffect, useMemo, useState } from "react";
import type { WorkScheduleDayResponse } from "@/lib/api/schema";
import { addDays, fmtTime, startOfWeek } from "@/lib/domain/format";
import { localDateKey } from "@/lib/domain/task";
import { dateOnly, useAttendanceMutations, useMemberSchedules, useMySchedules, useMyWorkWeek, useWorkWeek } from "@/lib/hooks/attendance";
import { useToast } from "@/lib/toast/ToastProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { Badge, Skeleton } from "@/components/ui/feedback";
import { Button, IconButton } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/form";
import { IconChevronLeft, IconChevronRight, IconClose, IconPlus } from "@/components/icons";

type Session = { start: string; end: string };
const STATUS_TONE = { pending: "warning", approved: "success", rejected: "danger" } as const;
const STATUS_LABEL = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Bị từ chối" } as const;
const DOW = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const MAX_SESSIONS = 3;

const iso = (dateKey: string, hhmm: string) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(y, m - 1, d, h, mi).toISOString();
};
const hhmm = (isoStr: string) => fmtTime(isoStr);
const serverSessions = (s?: WorkScheduleDayResponse): Session[] => (s?.sessions ?? []).map((v) => ({ start: hhmm(v.startAt), end: hhmm(v.endAt) }));

export function ScheduleWeek({ memberId: fixedMember }: { memberId?: string }) {
  const { workspaceId, isManager, members } = useWorkspace();
  const toast = useToast();
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const [memberId, setMemberId] = useState(fixedMember ?? "");
  const from = dateOnly(anchor);
  const to = dateOnly(addDays(anchor, 6));
  const mine = useMySchedules(workspaceId, from, to);
  const other = useMemberSchedules(workspaceId, memberId, from, to);
  const q = memberId ? other : mine;
  const week = useWorkWeek(workspaceId);
  const myWeek = useMyWorkWeek(workspaceId);
  const m = useAttendanceMutations(workspaceId);
  const own = !memberId;

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(anchor, i)), [anchor]);
  const server = useMemo(() => new Map((q.data ?? []).map((s: WorkScheduleDayResponse) => [s.date.slice(0, 10), s])), [q.data]);
  const serverWeekNote = useMemo(() => (q.data ?? []).map((s) => s.weekNote ?? "").find((n) => n) ?? "", [q.data]);
  const [draft, setDraft] = useState<Record<string, Session[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [weekNote, setWeekNote] = useState("");

  useEffect(() => {
    const d: Record<string, Session[]> = {};
    const n: Record<string, string> = {};
    for (const k of days.map(localDateKey)) {
      d[k] = serverSessions(server.get(k));
      n[k] = server.get(k)?.note ?? "";
    }
    setDraft(d);
    setNotes(n);
    setWeekNote(serverWeekNote);
  }, [server, serverWeekNote, days]);

  const dirtySessions = days.some((d) => JSON.stringify(draft[localDateKey(d)] ?? []) !== JSON.stringify(serverSessions(server.get(localDateKey(d)))));
  const dirtyNotes = days.some((d) => (notes[localDateKey(d)] ?? "") !== (server.get(localDateKey(d))?.note ?? "")) || weekNote !== serverWeekNote;
  const dirty = dirtySessions || dirtyNotes;
  const invalid = days.some((d) => (draft[localDateKey(d)] ?? []).some((s) => !s.start || !s.end || s.end <= s.start));

  const applyWeek = (wkDays?: { dayOfWeek: number; sessions: { startTime: string; endTime: string }[] }[]) => {
    const wk = new Map((wkDays ?? []).map((d) => [d.dayOfWeek, d.sessions]));
    setDraft(Object.fromEntries(days.map((d) => [localDateKey(d), (wk.get(d.getDay()) ?? []).map((s) => ({ start: s.startTime, end: s.endTime }))])));
  };
  const saveMyDefault = () => {
    const wkDays = days
      .map((d) => ({ dayOfWeek: d.getDay(), sessions: (draft[localDateKey(d)] ?? []).map((s) => ({ startTime: s.start, endTime: s.end })) }))
      .filter((d) => d.sessions.length)
      // Gộp theo thứ (một tuần đăng ký không trùng thứ, nhưng vẫn an toàn nếu khung thay đổi).
      .reduce((acc, d) => (acc.some((x) => x.dayOfWeek === d.dayOfWeek) ? acc : [...acc, d]), [] as { dayOfWeek: number; sessions: { startTime: string; endTime: string }[] }[]);
    m.saveMyWorkWeek.mutate({ days: wkDays }, { onSuccess: () => toast.success("Đã lưu lịch mặc định của bạn"), onError: (e: unknown) => toast.error(e) });
  };
  const save = () => {
    const schedules = days
      .filter((d) => draft[localDateKey(d)]?.length || notes[localDateKey(d)] || server.get(localDateKey(d)))
      .map((d) => ({
        date: localDateKey(d),
        note: notes[localDateKey(d)] || undefined,
        sessions: (draft[localDateKey(d)] ?? []).map((s) => ({ startAt: iso(localDateKey(d), s.start), endAt: iso(localDateKey(d), s.end) })),
      }));
    const done = { onSuccess: () => toast.success(memberId ? "Đã lưu lịch cho thành viên" : "Đã gửi đăng ký lịch — chờ quản lý duyệt"), onError: (e: unknown) => toast.error(e) };
    if (memberId) m.saveMemberSchedules.mutate({ memberId, schedules, weekNote: weekNote || undefined }, done);
    else m.saveMySchedules.mutate({ schedules, weekNote: weekNote || undefined }, done);
  };
  const busy = m.saveMySchedules.isPending || m.saveMemberSchedules.isPending;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label="Tuần trước" onClick={() => setAnchor((a) => addDays(a, -7))}><IconChevronLeft size={14} /></IconButton>
        <span className="min-w-[150px] text-center font-mono text-[13px]">{days[0].getDate()}/{days[0].getMonth() + 1} – {days[6].getDate()}/{days[6].getMonth() + 1}/{days[6].getFullYear()}</span>
        <IconButton label="Tuần sau" onClick={() => setAnchor((a) => addDays(a, 7))}><IconChevronRight size={14} /></IconButton>
        <Button size="sm" variant="ghost" onClick={() => setAnchor(startOfWeek(new Date()))}>Tuần này</Button>
        <span className="flex-1" />
        {isManager && !fixedMember && (
          <Select small aria-label="Thành viên" className="w-48" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">Lịch của tôi</option>
            {members.map((mm) => <option key={mm.userId} value={mm.userId}>{mm.userName}</option>)}
          </Select>
        )}
        <Button variant="primary" onClick={save} loading={busy} disabled={!dirty || invalid}>{memberId ? "Lưu lịch" : "Gửi đăng ký"}</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {own && <Button size="sm" onClick={() => applyWeek(myWeek.data?.days)} disabled={!myWeek.data?.days?.length}>Áp dụng lịch mặc định của tôi</Button>}
        {own && <Button size="sm" variant="ghost" onClick={saveMyDefault} loading={m.saveMyWorkWeek.isPending} disabled={invalid}>Lưu tuần này làm mặc định của tôi</Button>}
        <Button size="sm" variant="ghost" onClick={() => applyWeek(week.data?.days)} disabled={!week.data}>Áp dụng lịch chuẩn công ty</Button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[12.5px] font-medium text-ink-muted">Ghi chú cho cả đợt <span className="text-ink-faint">(tuỳ chọn)</span></span>
        <Textarea rows={2} value={weekNote} onChange={(e) => setWeekNote(e.target.value)} placeholder="Ghi chú chung cho cả tuần đăng ký này…" />
      </label>

      {q.isLoading ? <Skeleton className="h-64" /> : (
        <ul className="overflow-hidden rounded-lg border border-line bg-surface">
          {days.map((d) => {
            const key = localDateKey(d);
            const s = server.get(key);
            const list = draft[key] ?? [];
            const past = key < localDateKey();
            return (
              <li key={key} className="flex flex-wrap items-start gap-3 border-b border-line-row px-4 py-2.5 last:border-b-0">
                <div className="w-[120px] shrink-0 pt-1"><p className="text-[13px] font-medium">{DOW[d.getDay()]}</p><p className="font-mono text-[11.5px] text-ink-faint">{d.getDate()}/{d.getMonth() + 1}</p></div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {list.map((ss, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="time" aria-label={`Bắt đầu ca ${i + 1} ${DOW[d.getDay()]}`} disabled={past && !isManagerEdit(memberId)} value={ss.start} onChange={(e) => setDraft((x) => ({ ...x, [key]: list.map((v, j) => (j === i ? { ...v, start: e.target.value } : v)) }))} className="h-ctl-sm rounded-md border border-line-strong bg-surface px-2 font-mono text-[12.5px]" />
                      <span className="text-ink-faint">→</span>
                      <input type="time" aria-label={`Kết thúc ca ${i + 1} ${DOW[d.getDay()]}`} disabled={past && !isManagerEdit(memberId)} value={ss.end} onChange={(e) => setDraft((x) => ({ ...x, [key]: list.map((v, j) => (j === i ? { ...v, end: e.target.value } : v)) }))} className={`h-ctl-sm rounded-md border bg-surface px-2 font-mono text-[12.5px] ${ss.end && ss.end <= ss.start ? "border-danger" : "border-line-strong"}`} />
                      <button type="button" aria-label="Xoá ca" onClick={() => setDraft((x) => ({ ...x, [key]: list.filter((_, j) => j !== i) }))} className="text-ink-faint hover:text-danger"><IconClose size={12} /></button>
                    </div>
                  ))}
                  {list.length === 0 && <span className="pt-1 text-[12.5px] text-ink-muted">Không làm việc</span>}
                  <div className="flex flex-wrap items-center gap-2">
                    {list.length < MAX_SESSIONS && <Button size="sm" variant="ghost" onClick={() => setDraft((x) => ({ ...x, [key]: [...list, { start: "08:00", end: "17:00" }] }))}><IconPlus size={12} /> Thêm ca</Button>}
                    <Input small aria-label={`Ghi chú ${DOW[d.getDay()]}`} className="min-w-0 flex-1" value={notes[key] ?? ""} onChange={(e) => setNotes((x) => ({ ...x, [key]: e.target.value }))} placeholder="Ghi chú ngày (tuỳ chọn)" />
                  </div>
                </div>
                {s?.status && <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
const isManagerEdit = (memberId: string) => !!memberId;
