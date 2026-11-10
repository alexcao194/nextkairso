"use client";

import { useEffect, useState } from "react";
import type { ModuleResponse, ProjectMemberResponse, TaskLabelResponse } from "@/lib/api/schema";
import { PRIORITY_LEVELS, PRIORITY_META, STATUS_META, TASK_STATUSES } from "@/lib/domain/task";
import {
  COLUMN_META,
  COLUMN_ORDER,
  DEFAULT_COLUMNS,
  GROUP_LABEL,
  SORT_LABEL,
  activeFilterCount,
  serializeSort,
  type ColumnKey,
  type GroupBy,
  type SortField,
  type TaskView,
} from "@/lib/domain/taskView";
import { listParam, useTaskViewState } from "@/lib/hooks/useTaskView";
import { Popover } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { SearchInput, Select } from "@/components/ui/form";
import { IconArrowRight, IconChevronDown, IconColumns, IconFilter, IconList, IconPlus, IconClose } from "@/components/icons";

type SetParams = ReturnType<typeof useTaskViewState>["setParams"];

function CheckGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset className="px-2 py-1.5">
      <legend className="pb-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint">{title}</legend>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
              className={`h-6 max-w-[160px] truncate rounded-full border px-2.5 text-[12px] ${
                on ? "border-accent-border bg-accent-soft font-medium text-accent-ink" : "border-line-strong text-ink-2 hover:bg-hover"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ProjectToolbar({
  view,
  setParams,
  columns,
  setColumns,
  members,
  labels,
  modules,
  count,
  totalEstimation,
  showColumns = true,
  showGroup = true,
}: {
  view: TaskView;
  setParams: SetParams;
  columns: ColumnKey[];
  setColumns: (c: ColumnKey[]) => void;
  members: ProjectMemberResponse[];
  labels: TaskLabelResponse[];
  modules: ModuleResponse[];
  count: number;
  totalEstimation: number;
  showColumns?: boolean;
  showGroup?: boolean;
}) {
  const [q, setQ] = useState(view.q);
  useEffect(() => setQ(view.q), [view.q]);
  useEffect(() => {
    if (q === view.q) return;
    const t = setTimeout(() => setParams({ q: q || null }), 250);
    return () => clearTimeout(t);
  }, [q, view.q, setParams]);

  const nFilters = activeFilterCount(view);
  const chip = "inline-flex h-ctl-sm shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-line-strong bg-surface px-2.5 text-[12px] text-ink-2 hover:bg-hover";

  return (
    <div className="flex h-toolbar shrink-0 items-center gap-2 overflow-x-auto border-b border-line bg-surface px-4">
      <SearchInput value={q} onChange={setQ} placeholder="Tìm task…" label="Tìm task" className="w-[220px] shrink-0 max-sm:w-[150px]" />

      <Popover
        trigger={({ ref, open: _o, ...p }) => (
          <button ref={ref} type="button" {...p} className={`${chip} ${nFilters ? "border-accent-border bg-accent-soft text-accent-ink" : ""}`}>
            <IconFilter size={13} /> Lọc{nFilters > 0 && <span className="font-mono text-[11px]">{nFilters}</span>}
          </button>
        )}
      >
        {() => (
          <div className="w-[340px] max-w-[90vw]">
            <CheckGroup title="Trạng thái" value={view.status} onChange={(v) => setParams({ status: listParam(v) })} options={TASK_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))} />
            <CheckGroup title="Ưu tiên" value={view.priority} onChange={(v) => setParams({ priority: listParam(v) })} options={PRIORITY_LEVELS.map((l) => ({ value: String(PRIORITY_META[l].api), label: `${PRIORITY_META[l].tag} ${PRIORITY_META[l].label}` }))} />
            <CheckGroup title="Module" value={view.module} onChange={(v) => setParams({ module: listParam(v) })} options={[{ value: "none", label: "Không có module" }, ...modules.map((m) => ({ value: m.id, label: m.name }))]} />
            <CheckGroup title="Người làm" value={view.worker} onChange={(v) => setParams({ worker: listParam(v) })} options={[{ value: "none", label: "Chưa giao" }, ...members.map((m) => ({ value: m.userId, label: m.userName }))]} />
            <CheckGroup title="Nhãn" value={view.label} onChange={(v) => setParams({ label: listParam(v) })} options={labels.map((l) => ({ value: l.id, label: l.name }))} />
            <div className="flex items-center gap-2 px-2 py-1.5">
              <label htmlFor="flt-arch" className="text-[12px] text-ink-2">
                Lưu trữ
              </label>
              <Select id="flt-arch" small className="w-36" value={view.archived} onChange={(e) => setParams({ archived: e.target.value === "active" ? null : e.target.value })}>
                <option value="active">Đang hoạt động</option>
                <option value="archived">Đã lưu trữ</option>
                <option value="all">Tất cả</option>
              </Select>
            </div>
            {nFilters > 0 && (
              <div className="border-t border-line px-2 pb-1 pt-2">
                <Button size="sm" variant="ghost" onClick={() => setParams({ status: null, priority: null, module: null, worker: null, label: null, archived: null })}>
                  <IconClose size={12} /> Xoá bộ lọc
                </Button>
              </div>
            )}
          </div>
        )}
      </Popover>

      {showGroup && (
        <Popover
          role="menu"
          trigger={({ ref, open: _o, ...p }) => (
            <button ref={ref} type="button" {...p} className={chip}>
              <IconList size={13} /> Nhóm: {GROUP_LABEL[view.group]} <IconChevronDown size={11} className="text-ink-faint" />
            </button>
          )}
        >
          {(close) => (
            <div className="w-44">
              {(Object.keys(GROUP_LABEL) as GroupBy[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  role="menuitemradio"
                  aria-checked={view.group === g}
                  onClick={() => {
                    close();
                    setParams({ group: g === "status" ? null : g });
                  }}
                  className={`flex h-8 w-full items-center rounded-md px-2.5 text-left text-[13px] hover:bg-hover ${view.group === g ? "font-medium text-accent-ink" : ""}`}
                >
                  {GROUP_LABEL[g]}
                </button>
              ))}
            </div>
          )}
        </Popover>
      )}

      <Popover
        trigger={({ ref, open: _o, ...p }) => (
          <button ref={ref} type="button" {...p} className={chip}>
            <IconArrowRight size={13} className="rotate-90" /> Sắp xếp
          </button>
        )}
      >
        {() => (
          <div className="w-[280px] p-1">
            {view.sort.map((r, i) => (
              <div key={i} className="mb-1.5 flex items-center gap-1.5">
                <Select
                  small
                  aria-label={`Tiêu chí ${i + 1}`}
                  value={r.field}
                  onChange={(e) => setParams({ sort: serializeSort(view.sort.map((x, j) => (j === i ? { ...x, field: e.target.value as SortField } : x))) })}
                >
                  {(Object.keys(SORT_LABEL) as SortField[]).map((f) => (
                    <option key={f} value={f}>
                      {SORT_LABEL[f]}
                    </option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  aria-label={r.dir === "asc" ? "Tăng dần" : "Giảm dần"}
                  onClick={() => setParams({ sort: serializeSort(view.sort.map((x, j) => (j === i ? { ...x, dir: x.dir === "asc" ? "desc" : "asc" } : x))) })}
                >
                  {r.dir === "asc" ? "A→Z" : "Z→A"}
                </Button>
                <button
                  type="button"
                  aria-label="Bỏ tiêu chí"
                  disabled={view.sort.length === 1}
                  onClick={() => setParams({ sort: serializeSort(view.sort.filter((_, j) => j !== i)) })}
                  className="text-ink-faint hover:text-ink disabled:opacity-30"
                >
                  <IconClose size={12} />
                </button>
              </div>
            ))}
            <div className="flex gap-1.5 pt-1">
              <Button size="sm" onClick={() => {
                const used = new Set(view.sort.map((s) => s.field));
                const f = (Object.keys(SORT_LABEL) as SortField[]).find((x) => !used.has(x));
                if (f) setParams({ sort: serializeSort([...view.sort, { field: f, dir: "asc" }]) });
              }}>
                <IconPlus size={12} /> Thêm tiêu chí
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setParams({ sort: null })}>
                Mặc định
              </Button>
            </div>
          </div>
        )}
      </Popover>

      {showColumns && (
        <Popover
          trigger={({ ref, open: _o, ...p }) => (
            <button ref={ref} type="button" {...p} className={chip}>
              <IconColumns size={13} /> Cột
            </button>
          )}
        >
          {() => (
            <div className="w-52 p-1">
              {COLUMN_ORDER.map((c) => (
                <label key={c} className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] hover:bg-hover">
                  <input
                    type="checkbox"
                    disabled={COLUMN_META[c].locked}
                    checked={columns.includes(c)}
                    onChange={() => setColumns(columns.includes(c) ? columns.filter((x) => x !== c) : [...columns, c])}
                    className="size-4 accent-[var(--accent)]"
                  />
                  {COLUMN_META[c].label}
                </label>
              ))}
              <div className="border-t border-line pt-1">
                <Button size="sm" variant="ghost" onClick={() => setColumns(DEFAULT_COLUMNS)}>
                  Cột mặc định
                </Button>
              </div>
            </div>
          )}
        </Popover>
      )}

      <span className="flex-1" />
      <span className="shrink-0 font-mono text-[12px] text-ink-muted">
        {count} task{totalEstimation > 0 && <> · {totalEstimation}h</>}
      </span>
    </div>
  );
}
