"use client";

import { useState } from "react";
import type { CalendarDayResponse } from "@/lib/api/schema";
import { useAttendanceMutations, useDailyReports, useMyDailyReports } from "@/lib/hooks/attendance";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { Button, IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/feedback";
import { IconPlus, IconTrash } from "@/components/icons";

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
  approved: { label: "Đã duyệt", tone: "success" },
  pending: { label: "Chờ duyệt", tone: "warning" },
  rejected: { label: "Bị từ chối", tone: "danger" },
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
    <section aria-label="Báo cáo cuối ngày" className="flex flex-col gap-2 border-t border-line pt-3">
      <h4 className="text-[12.5px] font-semibold">Báo cáo cuối ngày</h4>
      <Row label="Đã xong" value={report.done} />
      <Row label="Đang làm" value={report.inProgress} />
      <Row label="Vấn đề cần trao đổi" value={report.issues} />
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
    ? "Nhập đủ giờ bắt đầu và kết thúc."
    : rows.some((r) => r.end <= r.start)
      ? "Giờ kết thúc phải sau giờ bắt đầu."
      : sorted.some((r, i) => i > 0 && r.start < sorted[i - 1].end)
        ? "Các ca không được chồng nhau."
        : null;
  const busy = m.saveMemberSchedules.isPending;

  const save = () => {
    const schedules = [{ date, sessions: sorted.map((r) => ({ startAt: toISO(date, r.start), endAt: toISO(date, r.end) })) }];
    const done = { onSuccess: () => toast.success(isManager ? "Đã lưu lịch làm" : "Đã gửi lịch, chờ quản lý duyệt"), onError: (e: unknown) => toast.error(e) };
    if (isManager) m.saveMemberSchedules.mutate({ memberId, schedules }, done);
    else m.saveMySchedules.mutate({ schedules }, done);
  };

  return (
    <section aria-label="Lịch làm" className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex items-center gap-2">
        <h4 className="text-[12.5px] font-semibold">Lịch làm</h4>
        {status && <Badge tone={status.tone}>{status.label}</Badge>}
      </div>
      {rows.length === 0 && <p className="text-[12.5px] text-ink-muted">Không có ca — ngày nghỉ.</p>}
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input type="time" aria-label={`Bắt đầu ca ${i + 1}`} value={r.start} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} className={timeInput} />
          <span className="text-ink-faint">–</span>
          <input type="time" aria-label={`Kết thúc ca ${i + 1}`} value={r.end} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} className={timeInput} />
          <IconButton label={`Xoá ca ${i + 1}`} variant="ghost" size="sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}><IconTrash size={13} /></IconButton>
        </div>
      ))}
      {problem && <p role="alert" className="text-[12px] text-danger">{problem}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {rows.length < MAX_SESSIONS && (
          <Button size="sm" variant="ghost" onClick={() => setRows([...rows, rows.length ? { start: "14:00", end: "18:00" } : { start: "09:00", end: "12:00" }])}>
            <IconPlus size={13} /> Thêm ca
          </Button>
        )}
        <span className="flex-1" />
        <Button size="sm" variant="primary" disabled={!dirty || !!problem} loading={busy || m.saveMySchedules.isPending} onClick={save}>Lưu lịch</Button>
      </div>
      {!isManager && <p className="text-[11.5px] text-ink-faint">Lịch bạn tự sửa sẽ chờ quản lý duyệt mới được tính công.</p>}
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

  const rowProblem = (r: SessionRow) => (!r.in && !r.out ? "Nhập giờ vào hoặc giờ ra." : r.in && r.out && r.out <= r.in ? "Giờ ra phải sau giờ vào." : null);

  const save = (i: number) => {
    const r = rows[i];
    setSaving(i);
    m.upsertSession.mutate(
      {
        memberId,
        checkIn: r.in ? { enabled: true, recordId: r.inId, recordedAt: toISO(date, r.in) } : { enabled: false, recordId: r.inId },
        checkOut: r.out ? { enabled: true, recordId: r.outId, recordedAt: toISO(date, r.out) } : { enabled: false, recordId: r.outId },
      },
      { onSuccess: () => toast.success("Đã lưu phiên chấm công"), onError: (e) => toast.error(e), onSettled: () => setSaving(null) },
    );
  };
  const remove = (i: number) => {
    const r = rows[i];
    if (!r.inId && !r.outId) return setRows(rows.filter((_, j) => j !== i));
    setSaving(i);
    m.upsertSession.mutate(
      { memberId, checkIn: { enabled: false, recordId: r.inId }, checkOut: { enabled: false, recordId: r.outId } },
      { onSuccess: () => toast.success("Đã xoá phiên chấm công"), onError: (e) => toast.error(e), onSettled: () => setSaving(null) },
    );
  };

  return (
    <section aria-label="Phiên chấm công" className="flex flex-col gap-2 border-t border-line pt-3">
      <h4 className="text-[12.5px] font-semibold">Phiên chấm công</h4>
      {rows.length === 0 && <p className="text-[12.5px] text-ink-muted">Chưa chấm công.</p>}
      {rows.map((r, i) => {
        const orig = initial[i];
        const changed = !orig || orig.in !== r.in || orig.out !== r.out;
        const problem = rowProblem(r);
        return (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="w-7 text-[12px] text-ink-faint">Vào</span>
              <input type="time" aria-label={`Giờ vào phiên ${i + 1}`} value={r.in} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, in: e.target.value } : x)))} className={timeInput} />
              <span className="w-5 text-right text-[12px] text-ink-faint">Ra</span>
              <input type="time" aria-label={`Giờ ra phiên ${i + 1}`} value={r.out} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, out: e.target.value } : x)))} className={timeInput} />
              <IconButton label={`Xoá phiên ${i + 1}`} variant="ghost" size="sm" disabled={saving !== null} onClick={() => remove(i)}><IconTrash size={13} /></IconButton>
              {changed && (
                <Button size="sm" variant="primary" disabled={!!problem || saving !== null} loading={saving === i} onClick={() => save(i)}>Lưu</Button>
              )}
            </div>
            {changed && problem && <p role="alert" className="text-[12px] text-danger">{problem}</p>}
          </div>
        );
      })}
      <div>
        <Button size="sm" variant="ghost" onClick={() => setRows([...rows, { in: "", out: "" }])}><IconPlus size={13} /> Thêm phiên</Button>
      </div>
      <p className="text-[11.5px] text-ink-faint">Để trống giờ vào hoặc giờ ra rồi Lưu để bỏ bản ghi đó.</p>
    </section>
  );
}
