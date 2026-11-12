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
import { tr } from "@/lib/i18n";
import { liveLabels } from "@/lib/i18n/live";
import { weekdayName } from "@/lib/domain/format";

type Session = { start: string; end: string };
const STATUS_TONE = { pending: "warning", approved: "success", rejected: "danger" } as const;
const STATUS_LABEL = liveLabels(() => tr().scheduleStatus);
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
    m.saveMyWorkWeek.mutate({ days: wkDays }, { onSuccess: () => toast.success(tr().schedWeek.savedDefault), onError: (e: unknown) => toast.error(e) });
  };
  const save = () => {
    const schedules = days
      .filter((d) => draft[localDateKey(d)]?.length || notes[localDateKey(d)] || server.get(localDateKey(d)))
      .map((d) => ({
        date: localDateKey(d),
        note: notes[localDateKey(d)] || undefined,
        sessions: (draft[localDateKey(d)] ?? []).map((s) => ({ startAt: iso(localDateKey(d), s.start), endAt: iso(localDateKey(d), s.end) })),
      }));
    const done = { onSuccess: () => toast.success(memberId ? tr().schedWeek.savedForMember : tr().schedWeek.submitted), onError: (e: unknown) => toast.error(e) };
    if (memberId) m.saveMemberSchedules.mutate({ memberId, schedules, weekNote: weekNote || undefined }, done);
    else m.saveMySchedules.mutate({ schedules, weekNote: weekNote || undefined }, done);
  };
  const busy = m.saveMySchedules.isPending || m.saveMemberSchedules.isPending;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label={tr().schedWeek.prevWeek} onClick={() => setAnchor((a) => addDays(a, -7))}><IconChevronLeft size={14} /></IconButton>
        <span className="min-w-[150px] text-center font-mono text-[13px]">{days[0].getDate()}/{days[0].getMonth() + 1} – {days[6].getDate()}/{days[6].getMonth() + 1}/{days[6].getFullYear()}</span>
        <IconButton label={tr().schedWeek.nextWeek} onClick={() => setAnchor((a) => addDays(a, 7))}><IconChevronRight size={14} /></IconButton>
        <Button size="sm" variant="ghost" onClick={() => setAnchor(startOfWeek(new Date()))}>{tr().schedWeek.thisWeek}</Button>
        <span className="flex-1" />
        {isManager && !fixedMember && (
          <Select small aria-label={tr().schedWeek.member} className="w-48" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">{tr().schedWeek.mine}</option>
            {members.map((mm) => <option key={mm.userId} value={mm.userId}>{mm.userName}</option>)}
          </Select>
        )}
        <Button variant="primary" onClick={save} loading={busy} disabled={!dirty || invalid}>{memberId ? tr().schedWeek.save : tr().schedWeek.submit}</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {own && <Button size="sm" onClick={() => applyWeek(myWeek.data?.days)} disabled={!myWeek.data?.days?.length}>{tr().schedWeek.applyDefault}</Button>}
        {own && <Button size="sm" variant="ghost" onClick={saveMyDefault} loading={m.saveMyWorkWeek.isPending} disabled={invalid}>{tr().schedWeek.saveAsDefault}</Button>}
        <Button size="sm" variant="ghost" onClick={() => applyWeek(week.data?.days)} disabled={!week.data}>{tr().schedWeek.applyCompany}</Button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[12.5px] font-medium text-ink-muted">{tr().schedWeek.weekNote} <span className="text-ink-faint">{tr().schedWeek.optional}</span></span>
        <Textarea rows={2} value={weekNote} onChange={(e) => setWeekNote(e.target.value)} placeholder={tr().schedWeek.weekNotePh} />
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
                <div className="w-[120px] shrink-0 pt-1"><p className="text-[13px] font-medium">{weekdayName(d)}</p><p className="font-mono text-[11.5px] text-ink-faint">{d.getDate()}/{d.getMonth() + 1}</p></div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {list.map((ss, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="time" aria-label={tr().schedWeek.shiftStart(i + 1, weekdayName(d))} disabled={past && !isManagerEdit(memberId)} value={ss.start} onChange={(e) => setDraft((x) => ({ ...x, [key]: list.map((v, j) => (j === i ? { ...v, start: e.target.value } : v)) }))} className="h-ctl-sm rounded-md border border-line-strong bg-surface px-2 font-mono text-[12.5px]" />
                      <span className="text-ink-faint">→</span>
                      <input type="time" aria-label={tr().schedWeek.shiftEnd(i + 1, weekdayName(d))} disabled={past && !isManagerEdit(memberId)} value={ss.end} onChange={(e) => setDraft((x) => ({ ...x, [key]: list.map((v, j) => (j === i ? { ...v, end: e.target.value } : v)) }))} className={`h-ctl-sm rounded-md border bg-surface px-2 font-mono text-[12.5px] ${ss.end && ss.end <= ss.start ? "border-danger" : "border-line-strong"}`} />
                      <button type="button" aria-label={tr().schedWeek.removeShift} onClick={() => setDraft((x) => ({ ...x, [key]: list.filter((_, j) => j !== i) }))} className="text-ink-faint hover:text-danger"><IconClose size={12} /></button>
                    </div>
                  ))}
                  {list.length === 0 && <span className="pt-1 text-[12.5px] text-ink-muted">{tr().schedWeek.off}</span>}
                  <div className="flex flex-wrap items-center gap-2">
                    {list.length < MAX_SESSIONS && <Button size="sm" variant="ghost" onClick={() => setDraft((x) => ({ ...x, [key]: [...list, { start: "08:00", end: "17:00" }] }))}><IconPlus size={12} /> {tr().schedWeek.addShift}</Button>}
                    <Input small aria-label={tr().schedWeek.dayNote(weekdayName(d))} className="min-w-0 flex-1" value={notes[key] ?? ""} onChange={(e) => setNotes((x) => ({ ...x, [key]: e.target.value }))} placeholder={tr().schedWeek.dayNotePh} />
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
