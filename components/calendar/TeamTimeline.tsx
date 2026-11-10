"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CalendarDayResponse } from "@/lib/api/schema";
import { DAY_STATE_LABEL, dayInfo, LIVE_STATE_ORDER, memberDayTimeline, timelineWindow, type LiveState } from "@/lib/domain/attendance";
import { addDays, startOfWeek } from "@/lib/domain/format";
import { localDateKey } from "@/lib/domain/task";
import { dateOnly, useMembersCalendar } from "@/lib/hooks/attendance";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { IconButton, Button } from "@/components/ui/Button";
import { Input, SearchInput, SegmentedControl } from "@/components/ui/form";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

const DOT = { full: "var(--success)", late: "var(--st-doing-dot)", missed: "var(--danger)", off: "transparent", extra: "var(--cyan-vivid)", upcoming: "var(--ink-disabled)", pending: "var(--st-review-dot)" } as const;
const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function TeamTimeline() {
  const { isManager } = useWorkspace();
  const [view, setView] = useUrlState("view", "day");
  const [day, setDay] = useUrlState("day", "");
  if (!isManager) return <EmptyState title="Chỉ quản lý xem được timeline đội nhóm" className="py-12" />;
  const mode = view === "week" ? "week" : "day";
  const toggle = <SegmentedControl size="sm" label="Kiểu xem" value={mode} onChange={(v) => setView(v)} options={[{ value: "day", label: "Ngày" }, { value: "week", label: "Tuần" }]} />;
  return mode === "day" ? (
    <DayTimeline dayKey={day || localDateKey()} setDay={(k) => setDay(k === localDateKey() ? null : k)} toggle={toggle} />
  ) : (
    <WeekTimeline toggle={toggle} openDay={(k) => { setDay(k === localDateKey() ? null : k); setView(null); }} />
  );
}

const STATE_CHIP: Record<LiveState, string> = {
  working: "bg-green-soft text-green",
  absent: "bg-danger-bg text-danger",
  waiting: "bg-warning-bg text-warning",
  done: "bg-accent-soft text-accent-ink",
  off: "bg-hover text-ink-faint",
};

const STATE_FILTER_LABEL: Record<LiveState, string> = {
  working: "Đang làm",
  absent: "Chưa vào / thiếu công",
  waiting: "Chưa tới ca",
  done: "Đã chấm công",
  off: "Không có ca",
};

function useNow(active: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

const shiftKey = (key: string, n: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return localDateKey(new Date(y, m - 1, d + n));
};

function DayTimeline({ dayKey, setDay, toggle }: { dayKey: string; setDay: (k: string) => void; toggle: React.ReactNode }) {
  const { workspaceId, isManager } = useWorkspace();
  const [stateFilter, setStateFilter] = useUrlState("st", "");
  const [search, setSearch] = useUrlState("q", "");
  const isToday = dayKey === localDateKey();
  const now = useNow(isToday);
  const q = useMembersCalendar(workspaceId, dayKey, dayKey, isManager);

  const rows = useMemo(
    () =>
      (q.data ?? [])
        .map((m) => ({ member: m, tl: memberDayTimeline(m.days?.find((d) => d.date.slice(0, 10) === dayKey), dayKey, now) }))
        .sort((a, b) => LIVE_STATE_ORDER.indexOf(a.tl.state) - LIVE_STATE_ORDER.indexOf(b.tl.state) || a.member.memberName.localeCompare(b.member.memberName, "vi")),
    [q.data, dayKey, now],
  );
  const counts = useMemo(() => {
    const c = Object.fromEntries(LIVE_STATE_ORDER.map((s) => [s, 0])) as Record<LiveState, number>;
    for (const r of rows) c[r.tl.state]++;
    return c;
  }, [rows]);
  const needle = search.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      (!stateFilter || r.tl.state === stateFilter) &&
      (!needle || r.member.memberName.toLowerCase().includes(needle) || r.member.memberAlias?.toLowerCase().includes(needle)),
  );

  const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() : undefined;
  const win = timelineWindow(rows.map((r) => r.tl), nowMin);
  const span = win.to - win.from;
  const pct = (m: number) => `${((Math.min(win.to, Math.max(win.from, m)) - win.from) / span) * 100}%`;
  const width = (a: number, b: number) => `${((Math.min(win.to, b) - Math.max(win.from, a)) / span) * 100}%`;
  const step = span > 14 * 60 ? 120 : 60;
  const ticks: number[] = [];
  for (let t = win.from; t <= win.to; t += 60) ticks.push(t);
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label="Ngày trước" onClick={() => setDay(shiftKey(dayKey, -1))}><IconChevronLeft size={14} /></IconButton>
        <label className="sr-only" htmlFor="team-day">Chọn ngày</label>
        <Input small id="team-day" type="date" className="w-[150px] font-mono" value={dayKey} onChange={(e) => e.target.value && setDay(e.target.value)} />
        <IconButton label="Ngày sau" onClick={() => setDay(shiftKey(dayKey, 1))}><IconChevronRight size={14} /></IconButton>
        <Button size="sm" variant="ghost" disabled={isToday} onClick={() => setDay(localDateKey())}>Hôm nay</Button>
        <span className="text-[13px] text-ink-muted">{date.getDay() === 0 ? "Chủ nhật" : `Thứ ${date.getDay() + 1}`}{isToday && " · hôm nay"}</span>
        <span className="flex-1" />
        <SearchInput value={search} onChange={(v) => setSearch(v || null)} placeholder="Tìm thành viên…" label="Tìm thành viên" className="w-52 max-sm:w-full" />
        {toggle}
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo trạng thái">
        <FilterChip on={!stateFilter} onClick={() => setStateFilter(null)} label="Tất cả" count={rows.length} />
        {LIVE_STATE_ORDER.map((s) => (
          <FilterChip key={s} on={stateFilter === s} onClick={() => setStateFilter(stateFilter === s ? null : s)} label={STATE_FILTER_LABEL[s]} count={counts[s]} tone={STATE_CHIP[s]} />
        ))}
      </div>

      {q.isLoading ? <Skeleton className="h-64" /> : rows.length === 0 ? (
        <EmptyState title="Chưa có dữ liệu" className="rounded-lg border border-line bg-surface py-10" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <div className="min-w-[860px]" role="table" aria-label={`Lịch làm và chấm công ngày ${d}/${m}/${y}`}>
            <div role="row" className="grid h-thead grid-cols-[240px_1fr] border-b border-line bg-surface-sunken">
              <div role="columnheader" className="sticky left-0 z-10 flex items-center border-r border-line bg-surface-sunken px-4 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Thành viên</div>
              <div role="columnheader" className="relative" aria-label="Trục giờ">
                {ticks.map((t) => (
                  <span key={t} className="absolute top-0 flex h-full items-end pb-1.5" style={{ left: pct(t) }} aria-hidden="true">
                    <span className={`h-2 border-l ${(t - win.from) % step === 0 ? "border-line-strong" : "border-line"}`} />
                    {(t - win.from) % step === 0 && t < win.to && <span className="ml-1 font-mono text-[10.5px] text-ink-faint">{`${t / 60}`.padStart(2, "0")}:00</span>}
                  </span>
                ))}
              </div>
            </div>

            {visible.length === 0 && <EmptyState title="Không có thành viên khớp bộ lọc" className="py-8" />}
            {visible.map(({ member, tl }) => (
              <div key={member.memberId} role="row" className="grid grid-cols-[240px_1fr] border-b border-line-row last:border-b-0 hover:bg-row-hover">
                <div role="cell" className="sticky left-0 z-10 flex items-center gap-2.5 border-r border-line bg-surface px-4 py-2">
                  <Avatar size="md" person={{ id: member.memberId, name: member.memberName, avatar: member.memberAvatar }} />
                  <div className="min-w-0">
                    <Link href={`/calendar?member=${member.memberId}`} className="block truncate text-[13px] font-medium text-ink hover:text-accent-ink hover:underline" title="Xem lịch tháng của thành viên">{member.memberName}</Link>
                    <span className="flex items-center gap-1.5 text-[11.5px]">
                      <span className={`rounded-full px-1.5 py-px font-medium ${STATE_CHIP[tl.state]}`}>{tl.label}</span>
                      {tl.hours > 0 && <span className="font-mono text-ink-muted">{tl.hours.toFixed(1)}h</span>}
                      {tl.lateMinutes > 0 && <span className="font-medium text-warning">muộn {tl.lateMinutes}′</span>}
                    </span>
                  </div>
                </div>
                <div role="cell" className="relative h-[60px]">
                  {ticks.map((t) => <span key={t} aria-hidden="true" className={`absolute inset-y-0 border-l ${(t - win.from) % step === 0 ? "border-line" : "border-line-subtle"}`} style={{ left: pct(t) }} />)}
                  {tl.schedule.map((b, i) => (
                    <span
                      key={`s${i}`}
                      title={`${b.pending ? "Lịch chờ duyệt" : "Lịch làm"} ${b.label}`}
                      className={`absolute top-2 flex h-[18px] items-center overflow-hidden rounded border px-1.5 font-mono text-[10.5px] font-medium whitespace-nowrap ${b.pending ? "border-dashed border-violet-line bg-violet-soft text-violet" : "border-accent-border bg-accent-soft text-accent-ink"}`}
                      style={{ left: pct(b.start), width: width(b.start, b.end) }}
                    >
                      {b.label}
                    </span>
                  ))}
                  {tl.actual.map((b, i) =>
                    b.stray ? (
                      <span key={`a${i}`} title={`Check-out không có check-in ${b.label}`} className="absolute top-[34px] h-[18px] w-1.5 -translate-x-1/2 rounded-sm bg-danger" style={{ left: pct(b.start) }} />
                    ) : (
                      <span
                        key={`a${i}`}
                        title={`${b.open ? "Đang làm" : "Chấm công"} ${b.label}`}
                        className={`absolute top-[34px] flex h-[18px] min-w-1.5 items-center overflow-hidden border border-green-line bg-green-soft px-1.5 font-mono text-[10.5px] font-medium whitespace-nowrap text-green ${b.open ? "rounded-l border-r-2 border-r-green-vivid" : "rounded"}`}
                        style={{ left: pct(b.start), width: width(b.start, b.end) }}
                      >
                        {b.label}
                      </span>
                    ),
                  )}
                  {nowMin !== undefined && <span aria-hidden="true" className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-danger" style={{ left: pct(nowMin) }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-muted" aria-label="Chú thích">
        <Legend className="border-accent-border bg-accent-soft" label="Lịch làm" />
        <Legend className="border-dashed border-violet-line bg-violet-soft" label="Lịch chờ duyệt" />
        <Legend className="border-green-line bg-green-soft" label="Giờ vào – ra thực tế" />
        <Legend className="border-green-line border-r-2 border-r-green-vivid bg-green-soft" label="Đang làm (chưa check-out)" />
        <Legend className="border-danger bg-danger" label="Check-out thiếu check-in" />
        {isToday && <Legend className="w-0.5 border-0 bg-danger" label="Giờ hiện tại" />}
      </ul>
    </div>
  );
}

function FilterChip({ on, onClick, label, count, tone }: { on: boolean; onClick: () => void; label: string; count: number; tone?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex h-ctl-sm items-center gap-1.5 rounded-full border px-3 text-[12.5px] transition-colors ${on ? "border-accent-border bg-accent-soft font-medium text-accent-ink" : "border-line-strong bg-surface text-ink-2 hover:bg-hover"}`}
    >
      {label}
      <span className={`rounded-full px-1.5 font-mono text-[11px] ${tone ?? "bg-hover text-ink-muted"}`}>{count}</span>
    </button>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden="true" className={`inline-block h-3 w-4 rounded-sm border ${className}`} />
      {label}
    </li>
  );
}

function WeekTimeline({ toggle, openDay }: { toggle: React.ReactNode; openDay: (key: string) => void }) {
  const { workspaceId, isManager } = useWorkspace();
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const days = Array.from({ length: 7 }, (_, i) => addDays(anchor, i));
  const q = useMembersCalendar(workspaceId, dateOnly(anchor), dateOnly(days[6]), isManager);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <IconButton label="Tuần trước" onClick={() => setAnchor((a) => addDays(a, -7))}><IconChevronLeft size={14} /></IconButton>
        <span className="min-w-[150px] text-center font-mono text-[13px]">{days[0].getDate()}/{days[0].getMonth() + 1} – {days[6].getDate()}/{days[6].getMonth() + 1}</span>
        <IconButton label="Tuần sau" onClick={() => setAnchor((a) => addDays(a, 7))}><IconChevronRight size={14} /></IconButton>
        <Button size="sm" variant="ghost" onClick={() => setAnchor(startOfWeek(new Date()))}>Tuần này</Button>
        <span className="flex-1" />
        {toggle}
      </div>
      {q.isLoading ? <Skeleton className="h-48" /> : (q.data ?? []).length === 0 ? <EmptyState title="Chưa có dữ liệu" className="rounded-lg border border-line bg-surface py-10" /> : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[720px] text-[12.5px]">
            <thead className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              <tr className="h-thead border-b border-line">
                <th className="px-4 text-left">Thành viên</th>
                {days.map((d) => (
                  <th key={d.toISOString()} className="px-1 text-center">
                    <button type="button" onClick={() => openDay(localDateKey(d))} className="rounded px-1.5 py-0.5 uppercase hover:bg-hover hover:text-ink" title="Xem timeline ngày này">
                      {WEEKDAY[d.getDay()]} {d.getDate()}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((m) => {
                const byKey = new Map((m.days ?? []).map((d) => [d.date.slice(0, 10), d]));
                return (
                  <tr key={m.memberId} className="h-12 border-b border-line-row">
                    <td className="px-4"><span className="flex items-center gap-2"><Avatar person={{ id: m.memberId, name: m.memberName, avatar: m.memberAvatar }} />{m.memberName}</span></td>
                    {days.map((d) => {
                      const key = localDateKey(d);
                      const info = dayInfo(byKey.get(key) as unknown as CalendarDayResponse, key);
                      return (
                        <td key={key} className="text-center" title={DAY_STATE_LABEL[info.state]}>
                          <span className="inline-flex flex-col items-center gap-0.5">
                            <span className="size-2 rounded-full" style={{ background: DOT[info.state] }} aria-label={DAY_STATE_LABEL[info.state]} />
                            <span className="font-mono text-[11px] text-ink-muted">{info.hours ? `${info.hours.toFixed(1)}h` : info.state === "off" ? "" : "—"}</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
