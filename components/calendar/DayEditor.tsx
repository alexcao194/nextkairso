"use client";

import { useState } from "react";
import type { CalendarDayResponse } from "@/lib/api/schema";
import { useAttendanceMutations, useDailyReports, useMyDailyReports } from "@/lib/hooks/attendance";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { Button, IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/feedback";
import { IconPlus, IconTrash } from "@/components/icons";
import { tr } from "@/lib/i18n";

const MAX_SESSIONS = 3;

const hhmm = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${`${d.getHours()}`.padStart(2, "0")}:${`${d.getMinutes()}`.padStart(2, "0")}`;
};
const toISO = (dateKey: string, time: string) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, mi).toISOString();
};

const STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  approved: { get label() { return tr().scheduleStatus.approved; }, tone: "success" },
  pending: { get label() { return tr().scheduleStatus.pending; }, tone: "warning" },
  rejected: { get label() { return tr().scheduleStatus.rejected; }, tone: "danger" },
};

const timeInput =
  "h-ctl-sm w-[92px] rounded-md border border-line-strong bg-surface px-2 font-mono text-[12.5px] text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:bg-hover disabled:text-ink-disabled";

export function DayEditor({ date, day, memberId, isSelf, isManager }: { date: string; day?: CalendarDayResponse; memberId: string; isSelf: boolean; isManager: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {(isManager || isSelf) && <ScheduleEditor date={date} day={day} memberId={memberId} isManager={isManager} />}
      {isManager && <SessionsEditor date={date} day={day} memberId={memberId} />}
      {(isManager || isSelf) && <DailyReportView date={date} memberId={memberId} isSelf={isSelf} isManager={isManager} />}
    </div>
  );
}

function DailyReportView({ date, memberId, isSelf, isManager }: { date: string; memberId: string; isSelf: boolean; isManager: boolean }) {
  const { workspaceId } = useWorkspace();
  const mine = useMyDailyReports(workspaceId, isSelf ? date : "", isSelf ? date : "");
  const other = useDailyReports(workspaceId, { memberId, from: date, to: date }, isManager && !isSelf);
  const report = (isSelf ? mine.data : other.data)?.[0];
  if (!report || (!report.done && !report.inProgress && !report.issues)) return null;
  const Row = ({ label, value }: { label: string; value: string }) =>
    value ? (
      <div className="flex flex-col gap-0.5">
        <span className="text-[11.5px] font-medium uppercase tracking-wide text-ink-faint">{label}</span>
        <p className="whitespace-pre-wrap text-[12.5px] text-ink-2">{value}</p>
      </div>
    ) : null;
  return (
    <section aria-label={tr().dayEditor.report} className="flex flex-col gap-2 border-t border-line pt-3">
      <h4 className="text-[12.5px] font-semibold">{tr().dayEditor.report}</h4>
      <Row label={tr().dayEditor.done} value={report.done} />
      <Row label={tr().dayEditor.doing} value={report.inProgress} />
      <Row label={tr().dayEditor.issues} value={report.issues} />
    </section>
  );
}

function ScheduleEditor({ date, day, memberId, isManager }: { date: string; day?: CalendarDayResponse; memberId: string; isManager: boolean }) {
  const { workspaceId } = useWorkspace();
  const m = useAttendanceMutations(workspaceId);
  const toast = useToast();
  const initial = (day?.schedule?.sessions ?? []).map((s) => ({ start: hhmm(s.startAt), end: hhmm(s.endAt) }));
  const [rows, setRows] = useState(initial);
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);
  const status = day?.schedule?.status ? STATUS[day.schedule.status] : undefined;

  const sorted = [...rows].sort((a, b) => a.start.localeCompare(b.start));
  const problem = rows.some((r) => !r.start || !r.end)
    ? tr().dayEditor.needTimes
    : rows.some((r) => r.end <= r.start)
      ? tr().dayEditor.endAfterStart
      : sorted.some((r, i) => i > 0 && r.start < sorted[i - 1].end)
        ? tr().dayEditor.noOverlap
        : null;
  const busy = m.saveMemberSchedules.isPending;

  const save = () => {
    const schedules = [{ date, sessions: sorted.map((r) => ({ startAt: toISO(date, r.start), endAt: toISO(date, r.end) })) }];
    const done = { onSuccess: () => toast.success(isManager ? tr().dayEditor.savedSchedule : tr().dayEditor.sentSchedule), onError: (e: unknown) => toast.error(e) };
    if (isManager) m.saveMemberSchedules.mutate({ memberId, schedules }, done);
    else m.saveMySchedules.mutate({ schedules }, done);
  };

  return (
    <section aria-label={tr().dayEditor.schedule} className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex items-center gap-2">
        <h4 className="text-[12.5px] font-semibold">{tr().dayEditor.schedule}</h4>
        {status && <Badge tone={status.tone}>{status.label}</Badge>}
      </div>
      {rows.length === 0 && <p className="text-[12.5px] text-ink-muted">{tr().dayEditor.dayOff}</p>}
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input type="time" aria-label={tr().dayEditor.shiftStart(i + 1)} value={r.start} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} className={timeInput} />
          <span className="text-ink-faint">–</span>
          <input type="time" aria-label={tr().dayEditor.shiftEnd(i + 1)} value={r.end} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} className={timeInput} />
          <IconButton label={tr().dayEditor.removeShift(i + 1)} variant="ghost" size="sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}><IconTrash size={13} /></IconButton>
        </div>
      ))}
      {problem && <p role="alert" className="text-[12px] text-danger">{problem}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {rows.length < MAX_SESSIONS && (
          <Button size="sm" variant="ghost" onClick={() => setRows([...rows, rows.length ? { start: "14:00", end: "18:00" } : { start: "09:00", end: "12:00" }])}>
            <IconPlus size={13} /> {tr().dayEditor.addShift}
          </Button>
        )}
        <span className="flex-1" />
        <Button size="sm" variant="primary" disabled={!dirty || !!problem} loading={busy || m.saveMySchedules.isPending} onClick={save}>{tr().dayEditor.saveSchedule}</Button>
      </div>
      {!isManager && <p className="text-[11.5px] text-ink-faint">{tr().dayEditor.selfEditNote}</p>}
    </section>
  );
}

interface SessionRow {
  inId?: string;
  outId?: string;
  in: string;
  out: string;
}

function SessionsEditor({ date, day, memberId }: { date: string; day?: CalendarDayResponse; memberId: string }) {
  const { workspaceId } = useWorkspace();
  const m = useAttendanceMutations(workspaceId);
  const toast = useToast();
  const initial: SessionRow[] = (day?.sessions ?? []).map((s) => ({ inId: s.checkIn?.id, outId: s.checkOut?.id, in: hhmm(s.checkIn?.recordedAt), out: hhmm(s.checkOut?.recordedAt) }));
  const [rows, setRows] = useState<SessionRow[]>(initial);
  const [saving, setSaving] = useState<number | null>(null);

  const rowProblem = (r: SessionRow) => (!r.in && !r.out ? tr().dayEditor.needInOut : r.in && r.out && r.out <= r.in ? tr().dayEditor.outAfterIn : null);

  const save = (i: number) => {
    const r = rows[i];
    setSaving(i);
    m.upsertSession.mutate(
      {
        memberId,
        checkIn: r.in ? { enabled: true, recordId: r.inId, recordedAt: toISO(date, r.in) } : { enabled: false, recordId: r.inId },
        checkOut: r.out ? { enabled: true, recordId: r.outId, recordedAt: toISO(date, r.out) } : { enabled: false, recordId: r.outId },
      },
      { onSuccess: () => toast.success(tr().dayEditor.savedSession), onError: (e) => toast.error(e), onSettled: () => setSaving(null) },
    );
  };
  const remove = (i: number) => {
    const r = rows[i];
    if (!r.inId && !r.outId) return setRows(rows.filter((_, j) => j !== i));
    setSaving(i);
    m.upsertSession.mutate(
      { memberId, checkIn: { enabled: false, recordId: r.inId }, checkOut: { enabled: false, recordId: r.outId } },
      { onSuccess: () => toast.success(tr().dayEditor.deletedSession), onError: (e) => toast.error(e), onSettled: () => setSaving(null) },
    );
  };

  return (
    <section aria-label={tr().dayEditor.sessions} className="flex flex-col gap-2 border-t border-line pt-3">
      <h4 className="text-[12.5px] font-semibold">{tr().dayEditor.sessions}</h4>
      {rows.length === 0 && <p className="text-[12.5px] text-ink-muted">{tr().dayEditor.noSessions}</p>}
      {rows.map((r, i) => {
        const orig = initial[i];
        const changed = !orig || orig.in !== r.in || orig.out !== r.out;
        const problem = rowProblem(r);
        return (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="w-7 text-[12px] text-ink-faint">{tr().dayEditor.in}</span>
              <input type="time" aria-label={tr().dayEditor.sessionIn(i + 1)} value={r.in} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, in: e.target.value } : x)))} className={timeInput} />
              <span className="w-5 text-right text-[12px] text-ink-faint">Ra</span>
              <input type="time" aria-label={tr().dayEditor.sessionOut(i + 1)} value={r.out} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, out: e.target.value } : x)))} className={timeInput} />
              <IconButton label={tr().dayEditor.removeSession(i + 1)} variant="ghost" size="sm" disabled={saving !== null} onClick={() => remove(i)}><IconTrash size={13} /></IconButton>
              {changed && (
                <Button size="sm" variant="primary" disabled={!!problem || saving !== null} loading={saving === i} onClick={() => save(i)}>{tr().dayEditor.save}</Button>
              )}
            </div>
            {changed && problem && <p role="alert" className="text-[12px] text-danger">{problem}</p>}
          </div>
        );
      })}
      <div>
        <Button size="sm" variant="ghost" onClick={() => setRows([...rows, { in: "", out: "" }])}><IconPlus size={13} /> {tr().dayEditor.addSession}</Button>
      </div>
      <p className="text-[11.5px] text-ink-faint">{tr().dayEditor.clearHint}</p>
    </section>
  );
}
