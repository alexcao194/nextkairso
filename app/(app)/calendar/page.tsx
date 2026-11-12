"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { gridRange, MonthGrid } from "@/components/calendar/MonthGrid";
import { ScheduleWeek } from "@/components/calendar/ScheduleWeek";
import { CheckRequests } from "@/components/calendar/CheckRequests";
import { PendingSchedules } from "@/components/calendar/PendingSchedules";
import { TeamTimeline } from "@/components/calendar/TeamTimeline";
import { ScheduleReportSummary } from "@/components/calendar/ScheduleReportSummary";
import { LateLogs } from "@/components/calendar/LateLogs";
import { useAttendanceStats, useCheckRequests, useMemberCalendar, useMyAttendanceStats, useMyCalendar, usePendingSchedules } from "@/lib/hooks/attendance";
import { useAuth } from "@/lib/auth/AuthContext";
import { DayEditor } from "@/components/calendar/DayEditor";
import { localDateKey } from "@/lib/domain/task";
import { monthKey } from "@/lib/domain/format";
import { DAY_STATE_LABEL, dayInfo } from "@/lib/domain/attendance";
import { fmtTime } from "@/lib/domain/format";
import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { Tabs } from "@/components/ui/Tabs";
import { Button, IconButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/form";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { MetricStrip } from "@/components/kairso/MetricStrip";
import { useDialogs } from "@/components/dialogs/DialogProvider";
import { IconChevronLeft, IconChevronRight, IconClock } from "@/components/icons";
import { tr } from "@/lib/i18n";
import { monthTitle } from "@/lib/domain/format";

type Tab = "attendance" | "schedule" | "requests" | "pending" | "team" | "summary" | "late";

export default function CalendarPage() {
  const { workspaceId, isManager } = useWorkspace();
  const { openCheckIn } = useDialogs();
  const [tab, setTab] = useUrlState("tab", "attendance");
  const [date] = useUrlState("date", "");
  const pendingS = usePendingSchedules(workspaceId, isManager);
  const pendingR = useCheckRequests(workspaceId, "all", "pending");
  const t = (["attendance", "schedule", "requests", "pending", "team", "summary", "late"].includes(tab) ? tab : "attendance") as Tab;

  const today = localDateKey();
  const todayCal = useMyCalendar(workspaceId, today, today);
  const todaySessions = todayCal.data?.[0]?.sessions ?? [];
  const checkedIn = todaySessions.some((s) => s.checkIn);
  const checkedOut = todaySessions.some((s) => s.checkOut);

  return (
    <>
      <TopBar>
        <Breadcrumb items={[{ label: tr().calPage.title }]} />
        <TopBarSpacer />
        <Button variant="primary" onClick={openCheckIn}>
          <IconClock size={14} /> {checkedIn && !checkedOut ? "Check out" : "Check in"}
        </Button>
      </TopBar>
      <Tabs
        label={tr().calPage.title}
        value={t}
        onChange={(v) => setTab(v === "attendance" ? null : v)}
        className="bg-surface px-3"
        tabs={[
          { value: "attendance", label: tr().calPage.attendance },
          { value: "schedule", label: tr().calPage.schedule },
          { value: "requests", label: tr().calPage.requests, count: isManager ? pendingR.data?.length : undefined },
          ...(isManager ? ([{ value: "pending", label: tr().calPage.pending, count: pendingS.data?.length }, { value: "team", label: tr().calPage.team }, { value: "summary", label: tr().calPage.summary }] as const) : []),
          { value: "late", label: tr().calPage.late },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1180px] p-5 max-sm:p-3">
          {t === "attendance" && <Attendance />}
          {t === "schedule" && <ScheduleWeek />}
          {t === "requests" && <CheckRequests prefillDate={date || undefined} />}
          {t === "pending" && <PendingSchedules />}
          {t === "team" && <TeamTimeline />}
          {t === "summary" && <ScheduleReportSummary />}
          {t === "late" && <LateLogs />}
        </div>
      </div>
    </>
  );
}

function Attendance() {
  const { workspaceId, isManager, members } = useWorkspace();
  const [monthParam, setMonthParam] = useUrlState("month", "");
  const [memberId, setMemberId] = useUrlState("member", "");
  const [selected, setSelected] = useState<string | null>(null);
  const now = new Date();
  const month = useMemo(() => {
    const [y, m] = (monthParam || monthKey(now)).split("-").map(Number);
    return new Date(y, (m || 1) - 1, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthParam]);
  const { from, to } = gridRange(month);
  const mine = useMyCalendar(workspaceId, from, to);
  const other = useMemberCalendar(workspaceId, memberId, from, to);
  const q = memberId ? other : mine;
  const { user } = useAuth();
  const myStats = useMyAttendanceStats(workspaceId, monthKey(month));
  const memberStats = useAttendanceStats(workspaceId, monthKey(month), memberId || undefined, !!memberId);
  const go = (delta: number) => { const d = new Date(month.getFullYear(), month.getMonth() + delta, 1); setMonthParam(monthKey(d) === monthKey(now) ? null : monthKey(d)); };
  const sel = (q.data ?? []).find((d) => d.date.slice(0, 10) === selected);
  const info = selected ? dayInfo(sel, selected) : null;
  const t = memberId ? memberStats.data?.members?.find((x) => x.memberId === memberId) : myStats.data;
  const statsLoading = memberId ? memberStats.isLoading : myStats.isLoading;

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5 max-lg:grid-cols-1">
      <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <IconButton label={tr().calPage.prevMonth} variant="ghost" onClick={() => go(-1)}><IconChevronLeft size={14} /></IconButton>
          <h2 className="min-w-[130px] text-center text-[14px] font-semibold">{monthTitle(month)}</h2>
          <IconButton label={tr().calPage.nextMonth} variant="ghost" onClick={() => go(1)}><IconChevronRight size={14} /></IconButton>
          <Button size="sm" variant="ghost" onClick={() => setMonthParam(null)}>{tr().calPage.today}</Button>
          <span className="flex-1" />
          {isManager && (
            <Select small aria-label={tr().calPage.viewOf} className="w-44" value={memberId} onChange={(e) => setMemberId(e.target.value || null)}>
              <option value="">{tr().calPage.mine}</option>
              {members.map((m) => <option key={m.userId} value={m.userId}>{m.userName}</option>)}
            </Select>
          )}
        </div>
        {q.isLoading ? <div className="p-4"><Skeleton className="h-[420px]" /></div> : <MonthGrid month={month} days={q.data ?? []} selected={selected} onSelect={setSelected} />}
      </section>

      <aside className="flex flex-col gap-4">
        <MetricStrip
          compact
          metrics={[
            { label: tr().calPage.hours, value: t ? Math.round(t.attendanceHours * 10) / 10 : statsLoading ? "…" : 0, hint: tr().calPage.registered(Math.round((t?.registeredHours ?? 0) * 10) / 10) },
            { label: tr().calPage.late, value: t?.lateDays ?? (statsLoading ? "…" : 0), tone: (t?.lateDays ?? 0) > 0 ? "danger" : "default" },
            { label: tr().calPage.early, value: t?.earlyLeaveDays ?? (statsLoading ? "…" : 0), tone: (t?.earlyLeaveDays ?? 0) > 0 ? "danger" : "default" },
          ]}
        />
        <section aria-labelledby="cal-day" className="rounded-lg border border-line bg-surface p-4">
          <h3 id="cal-day" className="mb-2 text-[13px] font-semibold">{selected ? tr().calPage.dayTitle(selected.split("-").reverse().join("/")) : tr().calPage.dayDetail}</h3>
          {!selected ? <p className="text-[13px] text-ink-muted">{tr().calPage.pickDay}</p> : (
            <div className="flex flex-col gap-2 text-[13px]">
              {info && <p><span className="text-ink-muted">{tr().calPage.status}</span> <span className="font-medium">{DAY_STATE_LABEL[info.state]}</span></p>}
              {info && info.presence > 0 && (
                <p className="font-mono text-[12px] text-ink-2">
                  {tr().calPage.hoursLine(info.hours.toFixed(1), info.presence.toFixed(1))}
                  {info.presence - info.hours >= 0.05 && <span className="block font-sans text-[11.5px] text-ink-faint">{tr().calPage.inShiftOnly}</span>}
                </p>
              )}
              {sel?.schedule && <p className="font-mono text-[12px] text-ink-2">{tr().calPage.shifts} {(sel.schedule.sessions ?? []).map((s) => `${fmtTime(s.startAt)}–${fmtTime(s.endAt)}`).join(" · ")}</p>}
              {(sel?.sessions ?? []).map((s, i) => <p key={i} className="font-mono text-[12px] text-ink-2">{tr().calPage.in} {s.checkIn ? fmtTime(s.checkIn.recordedAt) : "—"} · {tr().calPage.out} {s.checkOut ? fmtTime(s.checkOut.recordedAt) : "—"}</p>)}
              {(sel?.events ?? []).map((e) => <p key={e.id} className="text-[12.5px] text-ink-2">• {e.title}</p>)}
              {!sel && <EmptyState title={tr().calPage.noData} className="py-3" />}
              {user && (isManager || !memberId) && (
                <DayEditor key={`${memberId || user.id}-${selected}-${JSON.stringify([sel?.schedule ?? null, sel?.sessions ?? []])}`} date={selected} day={sel} memberId={memberId || user.id} isSelf={!memberId} isManager={isManager} />
              )}
              {!memberId && !isManager && selected < new Date().toISOString().slice(0, 10) && <Link href={`/calendar?tab=requests&date=${selected}`} className="mt-1 text-[12.5px] font-medium text-accent-ink">{tr().calPage.requestForDay}</Link>}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
