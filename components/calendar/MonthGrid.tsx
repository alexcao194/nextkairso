"use client";

import { useMemo } from "react";
import type { CalendarDayResponse } from "@/lib/api/schema";
import { DAY_STATE_LABEL, dayInfo, type DayState } from "@/lib/domain/attendance";
import { addDays, startOfWeek } from "@/lib/domain/format";
import { localDateKey } from "@/lib/domain/task";
import { dateOnly } from "@/lib/hooks/attendance";

const STATE_DOT: Record<DayState, string> = {
  full: "var(--success)",
  late: "var(--st-doing-dot)",
  missed: "var(--danger)",
  off: "transparent",
  extra: "var(--cyan-vivid)",
  upcoming: "var(--ink-disabled)",
  pending: "var(--st-review-dot)",
};

const STATE_TINT: Record<DayState, string> = {
  full: "var(--green-soft)",
  late: "var(--amber-soft)",
  missed: "var(--rose-soft)",
  off: "",
  extra: "",
  upcoming: "",
  pending: "var(--violet-soft)",
};

export const gridRange = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = startOfWeek(first);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const end = addDays(startOfWeek(last), 6);
  return { start, end, from: dateOnly(start), to: dateOnly(end) };
};

export function MonthGrid({ month, days, selected, onSelect }: { month: Date; days: CalendarDayResponse[]; selected: string | null; onSelect: (key: string) => void }) {
  const { start, end } = gridRange(month);
  const byKey = useMemo(() => new Map(days.map((d) => [d.date.slice(0, 10), d])), [days]);
  const today = localDateKey();
  const cells: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line text-center text-[11px] font-medium uppercase tracking-wide text-ink-faint" aria-hidden="true">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7" role="grid" aria-label={`Lịch chấm công tháng ${month.getMonth() + 1}/${month.getFullYear()}`}>
        {cells.map((d) => {
          const key = localDateKey(d);
          const day = byKey.get(key);
          const info = dayInfo(day, key);
          const inMonth = d.getMonth() === month.getMonth();
          const weekend = d.getDay() === 0 || d.getDay() === 6;
          const isToday = key === today;
          const events = day?.events ?? [];
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              onClick={() => onSelect(key)}
              aria-selected={selected === key}
              aria-label={`${d.getDate()}/${d.getMonth() + 1}: ${DAY_STATE_LABEL[info.state]}${info.hours ? `, ${info.hours.toFixed(1)} giờ công` : info.presence ? `, có mặt ${info.presence.toFixed(1)} giờ ngoài lịch` : ""}${events.length ? `, ${events.map((e) => e.title).join(", ")}` : ""}`}
              style={{ background: STATE_TINT[info.state] || undefined }}
              className={`relative flex h-[88px] flex-col gap-1 border-b border-r border-line-row p-1.5 text-left transition-[filter] hover:brightness-[0.97] max-sm:h-[64px] ${STATE_TINT[info.state] ? "" : weekend ? "bg-surface-sunken" : "bg-surface"} ${!inMonth ? "opacity-45" : ""} ${selected === key ? "outline outline-2 -outline-offset-2 outline-accent" : ""} ${isToday ? "ring-2 ring-inset ring-accent" : ""}`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`font-mono text-[12px] ${isToday ? "font-bold text-accent-ink" : "text-ink-2"}`}>{d.getDate()}</span>
                {info.state !== "off" && <span className="size-2 rounded-full" style={{ background: STATE_DOT[info.state] }} aria-hidden="true" />}
                {info.isLate && <span className="text-[9.5px] font-semibold text-warning max-sm:hidden">Muộn</span>}
                {info.isEarlyLeave && <span className="text-[9.5px] font-semibold text-warning max-sm:hidden">Sớm</span>}
              </span>
              {info.hours > 0 ? (
                <span className="font-mono text-[11px] text-ink-muted" title={info.presence - info.hours >= 0.05 ? `Có mặt ${info.presence.toFixed(1)}h, tính công ${info.hours.toFixed(1)}h (chỉ phần trong ca)` : undefined}>
                  {info.hours.toFixed(1)}h
                </span>
              ) : (
                info.state === "extra" && <span className="font-mono text-[11px] text-ink-faint">{info.presence.toFixed(1)}h ngoài lịch</span>
              )}
              {info.state === "missed" && <span className="text-[10.5px] font-medium text-danger max-sm:hidden">Thiếu công</span>}
              {events[0] && <span className="truncate rounded bg-hover px-1 text-[10px] text-ink-muted max-sm:hidden">{events[0].title}</span>}
            </button>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 text-[11.5px] text-ink-muted" aria-label="Chú thích">
        {(["full", "late", "missed", "extra", "pending", "upcoming"] as DayState[]).map((s) => (
          <li key={s} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: STATE_DOT[s] }} aria-hidden="true" />{DAY_STATE_LABEL[s]}</li>
        ))}
      </ul>
    </div>
  );
}
