"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { addDays, startOfWeek } from "@/lib/domain/format";
import { localDateKey } from "@/lib/domain/task";
import { SegmentedControl } from "@/components/ui/form";
import { tr } from "@/lib/i18n";
import { liveLabels } from "@/lib/i18n/live";

type Zoom = "day" | "week" | "month" | "quarter" | "year";
const PX: Record<Zoom, number> = { day: 44, week: 16, month: 6, quarter: 2.2, year: 0.6 };
const ZOOM_LABEL: Record<Zoom, string> = liveLabels(() => ({ day: tr().gantt.day, week: tr().gantt.week, month: tr().gantt.month, quarter: tr().gantt.quarter, year: tr().gantt.year }));
const ROW_H = 36;
const LABEL_W = 240;
const DAY = 86400000;

const dayIndex = (d: Date, origin: Date) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - origin.getTime()) / DAY);

export interface GanttBar {
  start: Date;
  end: Date;
  color: string;
  label?: string;
  hint?: string;
}
export interface GanttRow {
  id: string;
  label: ReactNode;
  bars: GanttBar[];
  onOpen?: () => void;
  title?: string;
}

export function Gantt({ rows, defaultZoom = "week", empty, scrollToToday = false }: { rows: GanttRow[]; defaultZoom?: Zoom; empty?: ReactNode; scrollToToday?: boolean }) {
  const [zoom, setZoom] = useState<Zoom>(defaultZoom);
  const scroller = useRef<HTMLDivElement>(null);
  const px = PX[zoom];

  const { origin, days } = useMemo(() => {
    const all = rows.flatMap((r) => r.bars.flatMap((b) => [b.start, b.end]));
    const today = new Date();
    const min = all.length ? new Date(Math.min(...all.map((d) => d.getTime()), today.getTime())) : today;
    const max = all.length ? new Date(Math.max(...all.map((d) => d.getTime()), today.getTime())) : today;
    const o = startOfWeek(addDays(min, -7));
    return { origin: o, days: Math.max(30, dayIndex(addDays(max, 21), o)) };
  }, [rows]);

  const header = useMemo(() => {
    const top: Array<{ label: string; w: number }> = [];
    const bottom: Array<{ label: string; w: number }> = [];
    let i = 0;
    while (i < days) {
      const d = addDays(origin, i);
      const lenTo = (next: Date) => Math.max(1, Math.min(days - i, dayIndex(next, origin) - i));
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const nextYear = new Date(d.getFullYear() + 1, 0, 1);
      const topNext = zoom === "quarter" || zoom === "year" ? nextYear : nextMonth;
      const topLabel = zoom === "quarter" || zoom === "year" ? `${d.getFullYear()}` : `Th${d.getMonth() + 1}/${d.getFullYear()}`;
      const tl = lenTo(topNext);
      top.push({ label: topLabel, w: tl * px });
      let j = 0;
      while (j < tl) {
        const b = addDays(d, j);
        let step = 1;
        let label = `${b.getDate()}`;
        if (zoom === "week") {
          step = Math.min(tl - j, 7 - ((b.getDay() + 6) % 7));
          label = `${b.getDate()}`;
        } else if (zoom === "month") {
          step = Math.min(tl - j, dayIndex(nextMonth, b));
          label = `T${b.getMonth() + 1}`;
        } else if (zoom === "quarter" || zoom === "year") {
          step = Math.min(tl - j, dayIndex(nextMonth, b));
          label = `${b.getMonth() + 1}`;
        }
        bottom.push({ label, w: step * px });
        j += step;
      }
      i += tl;
    }
    return { top, bottom };
  }, [days, origin, px, zoom]);

  const todayX = dayIndex(new Date(), origin) * px + px / 2;
  const width = days * px;

  useEffect(() => {
    if (scrollToToday) scroller.current?.scrollTo({ left: Math.max(0, todayX - 200) });
  }, [scrollToToday, todayX]);

  if (rows.length === 0) return <>{empty}</>;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <div className="flex h-toolbar shrink-0 items-center gap-2 border-b border-line px-4">
        <SegmentedControl label={tr().gantt.zoom} size="sm" value={zoom} onChange={setZoom} options={(Object.keys(ZOOM_LABEL) as Zoom[]).map((z) => ({ value: z, label: ZOOM_LABEL[z] }))} />
        <button
          type="button"
          onClick={() => scroller.current?.scrollTo({ left: Math.max(0, todayX - 200), behavior: "smooth" })}
          className="h-ctl-sm rounded-md border border-line-strong px-2.5 text-[12px] text-ink-2 hover:bg-hover"
        >
          {tr().gantt.today}
        </button>
      </div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-auto">
        <div style={{ width: width + LABEL_W }} className="relative">
          <div className="sticky top-0 z-20 flex border-b border-line bg-surface-sunken">
            <div style={{ width: LABEL_W }} className="sticky left-0 z-30 shrink-0 border-r border-line bg-surface-sunken" />
            <div style={{ width }}>
              <div className="flex h-6 border-b border-line-row">
                {header.top.map((c, i) => (
                  <div key={i} style={{ width: c.w }} className="shrink-0 truncate border-r border-line-row px-1.5 text-[11px] font-medium text-ink-2">
                    {c.label}
                  </div>
                ))}
              </div>
              <div className="flex h-6">
                {header.bottom.map((c, i) => (
                  <div key={i} style={{ width: c.w }} className="shrink-0 overflow-hidden border-r border-line-row text-center font-mono text-[10px] leading-6 text-ink-faint">
                    {c.w >= 12 ? c.label : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Đường "hôm nay" */}
            <div className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-accent" style={{ left: LABEL_W + todayX }} aria-hidden="true" />
            {rows.map((r) => (
              <div key={r.id} style={{ height: ROW_H }} className="flex border-b border-line-row hover:bg-row-hover">
                <div style={{ width: LABEL_W }} className="sticky left-0 z-10 flex shrink-0 items-center overflow-hidden border-r border-line bg-surface px-3 text-[12.5px]">
                  {r.label}
                </div>
                <div className="relative" style={{ width }}>
                  {r.bars.map((b, i) => {
                    const x = dayIndex(b.start, origin) * px;
                    const w = Math.max(6, (dayIndex(b.end, origin) - dayIndex(b.start, origin) + 1) * px);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={r.onOpen}
                        title={b.hint ?? r.title ?? b.label}
                        aria-label={b.hint ?? r.title ?? b.label}
                        className="absolute top-2 h-5 overflow-hidden rounded px-1.5 text-left text-[10.5px] font-medium leading-5 text-white hover:brightness-110"
                        style={{ left: x, width: w, background: b.color }}
                      >
                        {w > 60 ? b.label : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="sr-only">{tr().gantt.todayIs(localDateKey())}</p>
    </div>
  );
}
