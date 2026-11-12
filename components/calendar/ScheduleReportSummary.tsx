"use client";

import { useMemo, useState } from "react";
import type { DailyReportResponse, MemberCalendarResponse } from "@/lib/api/schema";
import { addDays, fmtTime, startOfWeek } from "@/lib/domain/format";
import { localDateKey } from "@/lib/domain/task";
import { dateOnly, useDailyReports, useMembersCalendar } from "@/lib/hooks/attendance";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, EmptyState, Skeleton } from "@/components/ui/feedback";
import { Button, IconButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/form";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import { tr } from "@/lib/i18n";
import { liveLabels } from "@/lib/i18n/live";
import { weekdayShort } from "@/lib/domain/format";

const STATUS_TONE = { pending: "warning", approved: "success", rejected: "danger" } as const;
const STATUS_LABEL = liveLabels(() => tr().scheduleStatus);

export function ScheduleReportSummary() {
  const { workspaceId, isManager, members } = useWorkspace();
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const [memberId, setMemberId] = useState("");
  const from = dateOnly(anchor);
  const to = dateOnly(addDays(anchor, 6));
  const cal = useMembersCalendar(workspaceId, from, to, isManager);
  const reports = useDailyReports(workspaceId, { from, to, memberId: memberId || undefined }, isManager);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(anchor, i)), [anchor]);
  const reportBy = useMemo(() => {
    const map = new Map<string, DailyReportResponse>();
    for (const r of reports.data ?? []) map.set(`${r.memberId}|${r.date.slice(0, 10)}`, r);
    return map;
  }, [reports.data]);

  const rows = useMemo(() => {
    const list = (cal.data ?? []) as MemberCalendarResponse[];
    return memberId ? list.filter((mm) => mm.memberId === memberId) : list;
  }, [cal.data, memberId]);

  if (!isManager) return <EmptyState title={tr().schedSum.managersOnly} className="py-12" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label={tr().schedSum.prevWeek} onClick={() => setAnchor((a) => addDays(a, -7))}><IconChevronLeft size={14} /></IconButton>
        <span className="min-w-[150px] text-center font-mono text-[13px]">{days[0].getDate()}/{days[0].getMonth() + 1} – {days[6].getDate()}/{days[6].getMonth() + 1}/{days[6].getFullYear()}</span>
        <IconButton label={tr().schedSum.nextWeek} onClick={() => setAnchor((a) => addDays(a, 7))}><IconChevronRight size={14} /></IconButton>
        <Button size="sm" variant="ghost" onClick={() => setAnchor(startOfWeek(new Date()))}>{tr().schedSum.thisWeek}</Button>
        <span className="flex-1" />
        <Select small aria-label={tr().schedSum.employee} className="w-48" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">{tr().schedSum.allEmployees}</option>
          {members.map((mm) => <option key={mm.userId} value={mm.userId}>{mm.userName}</option>)}
        </Select>
      </div>

      {cal.isLoading ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <EmptyState title={tr().schedSum.noData} className="rounded-lg border border-line bg-surface py-12" />
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((mm) => {
            const byDate = new Map((mm.days ?? []).map((d) => [d.date.slice(0, 10), d]));
            const entries = days
              .map((d) => {
                const key = localDateKey(d);
                const sessions = byDate.get(key)?.schedule?.sessions ?? [];
                const report = reportBy.get(`${mm.memberId}|${key}`);
                return { d, key, day: byDate.get(key), sessions, report };
              })
              .filter((e) => e.sessions.length > 0 || e.report);
            const scheduled = entries.filter((e) => e.sessions.length > 0).length;
            const reported = entries.filter((e) => e.report).length;
            return (
              <li key={mm.memberId} className="overflow-hidden rounded-lg border border-line bg-surface">
                <div className="flex items-center gap-2.5 border-b border-line px-4 py-2.5">
                  <Avatar person={{ id: mm.memberId, name: mm.memberName, avatar: mm.memberAvatar }} size="md" />
                  <span className="flex-1 text-[13px] font-semibold">{mm.memberName}</span>
                  <span className="text-[12px] text-ink-muted">{tr().schedSum.counts(scheduled, reported)}</span>
                </div>
                {entries.length === 0 ? (
                  <p className="px-4 py-3 text-[12.5px] text-ink-muted">{tr().schedSum.empty}</p>
                ) : (
                  <ul>
                    {entries.map(({ d, key, day, sessions, report }) => (
                      <li key={key} className="flex flex-col gap-1.5 border-b border-line-row px-4 py-2.5 last:border-b-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="w-[112px] shrink-0 font-mono text-[12.5px]">{weekdayShort(d)} {d.getDate()}/{d.getMonth() + 1}</span>
                          <span className="flex-1 font-mono text-[12.5px] text-ink-2">
                            {sessions.length ? sessions.map((s) => `${fmtTime(s.startAt)}–${fmtTime(s.endAt)}`).join("  ·  ") : <span className="text-ink-faint">{tr().schedSum.noShift}</span>}
                          </span>
                          {day?.schedule?.status && <Badge tone={STATUS_TONE[day.schedule.status as keyof typeof STATUS_TONE] ?? "neutral"}>{STATUS_LABEL[day.schedule.status as keyof typeof STATUS_LABEL] ?? day.schedule.status}</Badge>}
                        </div>
                        {report ? (
                          <div className="flex flex-col gap-1 rounded-md bg-hover px-2.5 py-2">
                            <ReportRow label={tr().schedSum.done} value={report.done} />
                            <ReportRow label={tr().schedSum.doing} value={report.inProgress} />
                            <ReportRow label={tr().schedSum.issues} value={report.issues} />
                          </div>
                        ) : (
                          <span className="text-[12px] text-ink-faint">{tr().schedSum.noReport}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="w-[72px] shrink-0 text-[11.5px] font-medium uppercase tracking-wide text-ink-faint">{label}</span>
      <p className="whitespace-pre-wrap text-[12.5px] text-ink-2">{value}</p>
    </div>
  );
}
