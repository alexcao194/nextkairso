"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ModuleResponse, TaskResponse } from "@/lib/api/schema";
import { COLUMN_META, COLUMN_ORDER, type ColumnKey, type TaskGroup } from "@/lib/domain/taskView";
import { isOverdue } from "@/lib/domain/task";
import { fmtDayMonth, projectColor } from "@/lib/domain/format";
import { useUpdateTask, type TaskPatch } from "@/lib/hooks/tasks";
import { useToast } from "@/lib/toast/ToastProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { AvatarGroup } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/feedback";
import { DueDate } from "@/components/kairso/DueDate";
import { ModuleChip } from "@/components/kairso/ModuleChip";
import { LabelChip } from "@/components/kairso/LabelChip";
import { PriorityPicker, StatusPicker } from "@/components/kairso/pickers";
import { IconAlert, IconChat, IconChevronDown, IconChevronRight, IconPlus } from "@/components/icons";
import { tr } from "@/lib/i18n";

const H_GROUP = 28;
const H_ROW = 36;
const OVERSCAN = 8;

type Row =
  | { kind: "group"; group: TaskGroup; h: number }
  | { kind: "task"; task: TaskResponse; h: number }
  | { kind: "add"; h: number };

export function TaskTable({
  groups,
  columns,
  modules,
  selectedId,
  onOpen,
  onAdd,
  emptyMessage = tr().taskTable.none,
}: {
  groups: TaskGroup[];
  columns: ColumnKey[];
  modules: ModuleResponse[];
  selectedId?: string | null;
  onOpen: (task: TaskResponse) => void;
  onAdd?: (title: string) => Promise<void>;
  emptyMessage?: string;
}) {
  const { projectById } = useWorkspace();
  const update = useUpdateTask();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const scroller = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewH, setViewH] = useState(800);

  const cols = COLUMN_ORDER.filter((c) => columns.includes(c));
  const template = cols.map((c) => COLUMN_META[c].width).join(" ");
  const minWidth = 24 + cols.reduce((w, c) => w + (parseInt(COLUMN_META[c].width.match(/\d+/)?.[0] ?? "100", 10) + 8), 0);

  const moduleName = useMemo(() => new Map(modules.map((m) => [m.id, m.name])), [modules]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const g of groups) {
      out.push({ kind: "group", group: g, h: H_GROUP });
      if (!collapsed.has(g.key)) for (const t of g.tasks) out.push({ kind: "task", task: t, h: H_ROW });
    }
    if (onAdd) out.push({ kind: "add", h: H_ROW });
    return out;
  }, [groups, collapsed, onAdd]);

  const offsets = useMemo(() => {
    const o: number[] = [];
    let y = 0;
    for (const r of rows) (o.push(y), (y += r.h));
    return { tops: o, total: y };
  }, [rows]);

  const virtual = rows.length > 200;
  let first = 0;
  let last = rows.length - 1;
  if (virtual) {
    const lo = scrollTop;
    const hi = scrollTop + viewH;
    first = Math.max(0, offsets.tops.findIndex((t, i) => t + rows[i].h >= lo) - OVERSCAN);
    let l = first;
    while (l < rows.length && offsets.tops[l] < hi) l++;
    last = Math.min(rows.length - 1, l + OVERSCAN);
  }

  const patch = (task: TaskResponse, p: TaskPatch) =>
    update.mutate({ id: task.id, patch: p }, { onError: (e) => toast.error(e) });

  const total = groups.reduce((n, g) => n + g.tasks.length, 0);

  return (
    <div
      ref={scroller}
      onScroll={(e) => {
        setScrollTop(e.currentTarget.scrollTop);
        setViewH(e.currentTarget.clientHeight);
      }}
      role="table"
      aria-label={tr().taskTable.list}
      aria-rowcount={total}
      className="min-h-0 flex-1 overflow-auto bg-surface"
    >
      <div style={{ minWidth }}>
        <div
          role="row"
          style={{ gridTemplateColumns: template }}
          className="sticky top-0 z-10 grid h-thead items-center gap-2 border-b border-line bg-surface-sunken px-3 text-[11px] font-medium uppercase tracking-wide text-ink-faint"
        >
          {cols.map((c) => (
            <span role="columnheader" key={c} className="truncate">
              {COLUMN_META[c].label}
            </span>
          ))}
        </div>

        {total === 0 && !onAdd && <p className="px-4 py-10 text-center text-[13px] text-ink-muted">{emptyMessage}</p>}

        <div style={virtual ? { height: offsets.total, position: "relative" } : undefined}>
          {rows.slice(first, last + 1).map((row, i) => {
            const idx = first + i;
            const pos: CSSProperties | undefined = virtual
              ? { position: "absolute", top: offsets.tops[idx], left: 0, right: 0, height: row.h }
              : undefined;
            if (row.kind === "group") {
              const isOpen = !collapsed.has(row.group.key);
              return (
                <div
                  key={`g-${row.group.key}`}
                  style={{
                    height: row.h,
                    ...pos,
                    background: row.group.dot ? `color-mix(in srgb, ${row.group.dot} 9%, var(--surface))` : "var(--group-header)",
                    boxShadow: row.group.dot ? `inset 3px 0 0 ${row.group.dot}` : undefined,
                  }}
                  className="flex items-center border-b border-line px-3"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setCollapsed((s) => {
                        const n = new Set(s);
                        if (n.has(row.group.key)) n.delete(row.group.key);
                        else n.add(row.group.key);
                        return n;
                      })
                    }
                    className="flex h-full items-center gap-2 text-[12px] font-semibold text-ink"
                  >
                    {isOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                    {row.group.dot && <span className="size-2 rounded-full" style={{ background: row.group.dot }} aria-hidden="true" />}
                    <span>{row.group.label}</span>
                    <span className="rounded-full bg-surface/70 px-1.5 font-mono text-[11px] font-semibold text-ink-muted">{row.group.tasks.length}</span>
                  </button>
                </div>
              );
            }
            if (row.kind === "add") {
              return (
                <div key="add" style={{ height: row.h, ...pos }} className="border-b border-line-row">
                  <AddRow onAdd={onAdd!} />
                </div>
              );
            }
            const t = row.task;
            const selected = t.id === selectedId;
            return (
              <div
                key={t.id}
                role="row"
                aria-selected={selected}
                style={{ gridTemplateColumns: template, height: row.h, ...pos }}
                className={`relative grid items-center gap-2 border-b border-line-row px-3 text-[13px] ${
                  selected ? "bg-accent-soft" : "hover:bg-row-hover"
                } ${t.archived ? "opacity-60" : ""}`}
              >
                {selected && <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" aria-hidden="true" />}
                {cols.map((c) => (
                  <div role="cell" key={c} className="min-w-0">
                    {renderCell(c, t, { moduleName, projectName: (id) => projectById(id)?.name, onOpen, patch })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function renderCell(
  c: ColumnKey,
  t: TaskResponse,
  x: {
    moduleName: Map<string, string>;
    projectName: (id: string) => string | undefined;
    onOpen: (t: TaskResponse) => void;
    patch: (t: TaskResponse, p: TaskPatch) => void;
  },
) {
  switch (c) {
    case "code":
      return <span className="font-mono text-[12px] text-ink-faint">{t.code}</span>;
    case "title":
      return (
        <span className="flex min-w-0 items-center gap-1.5">
          <button type="button" onClick={() => x.onOpen(t)} className="min-w-0 truncate text-left font-medium text-ink hover:text-accent-ink">
            {t.title}
          </button>
          {/* Chỉ dấu quá hạn luôn hiện, không phụ thuộc cột "Hạn" có bật hay không. */}
          {isOverdue(t) && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-danger-bg px-1.5 py-[1px] text-[10.5px] font-semibold text-danger" title={tr().taskTable.overdueHint}>
              <IconAlert size={10} /> {tr().taskTable.overdue}
            </span>
          )}
        </span>
      );
    case "status":
      return <StatusPicker bare value={t.status} onChange={(status) => x.patch(t, { status })} />;
    case "priority":
      return <PriorityPicker bare value={t.priority} onChange={(priority) => x.patch(t, { priority })} />;
    case "module":
      return <ModuleChip name={t.moduleId ? x.moduleName.get(t.moduleId) : undefined} />;
    case "workers":
      return <AvatarGroup people={(t.workers ?? []).map((w) => ({ id: w.user.id, name: w.user.name, avatar: w.user.avatar }))} />;
    case "faultHolders":
      return <AvatarGroup people={(t.faultHolders ?? []).map((w) => ({ id: w.user.id, name: w.user.name, avatar: w.user.avatar }))} />;
    case "due":
      return <DueDate date={t.endDate} status={t.status} />;
    case "start":
      return <span className="font-mono text-[12px] text-ink-muted">{t.startDate ? fmtDayMonth(t.startDate) : "—"}</span>;
    case "estimate":
      return <span className="font-mono text-[12px] text-ink-muted">{t.estimation ? `${t.estimation}h` : "—"}</span>;
    case "returnCount":
      return <ReturnCountCell value={t.returnCount} onCommit={(n) => x.patch(t, { returnCount: n })} />;
    case "labels":
      return (
        <span className="flex gap-1 overflow-hidden">
          {(t.labels ?? []).slice(0, 2).map((l) => (
            <LabelChip key={l.id} name={l.name} color={l.color} />
          ))}
          {(t.labels ?? []).length > 2 && <span className="text-[11px] text-ink-faint">+{t.labels.length - 2}</span>}
        </span>
      );
    case "project": {
      const name = x.projectName(t.projectId);
      return (
        <span className="flex items-center gap-1.5 truncate text-[12.5px] text-ink-2">
          <span className="size-2 shrink-0 rounded-[2px]" style={{ background: projectColor(t.projectId) }} />
          <span className="truncate">{name ?? "—"}</span>
        </span>
      );
    }
    case "alert":
      return isOverdue(t) ? (
        <Badge tone="danger">
          <IconAlert size={11} /> {tr().taskTable.overdue}
        </Badge>
      ) : (
        <span className="text-ink-disabled">—</span>
      );
    case "feedback":
      return t.linkedFeedbackCount > 0 ? <Badge tone="accent">{t.linkedFeedbackCount} feedback</Badge> : <span className="text-ink-disabled">—</span>;
    case "comments":
      return t.unreadCommentCount > 0 ? (
        <Badge tone="accent">
          <IconChat size={11} /> {tr().taskTable.newComments(t.unreadCommentCount ?? 0)}
        </Badge>
      ) : (
        <span className="text-ink-disabled">—</span>
      );
  }
}

function ReturnCountCell({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value || ""));
  useEffect(() => setV(String(value || "")), [value]);

  const commit = () => {
    const n = Math.max(0, Math.round(Number(v) || 0));
    if (n !== value) onCommit(n);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={(e) => (e.stopPropagation(), setEditing(true))}
        aria-label={tr().taskTable.editReturns}
        className="block w-full rounded px-1 -mx-1 text-left font-mono text-[12px] text-ink-muted hover:bg-hover hover:text-ink"
      >
        {value || "—"}
      </button>
    );
  }
  return (
    <input
      autoFocus
      type="number"
      min={0}
      aria-label={tr().taskTable.returns}
      value={v}
      onFocus={(e) => e.currentTarget.select()}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") (setV(String(value || "")), setEditing(false));
      }}
      className="h-6 w-14 rounded border border-accent bg-surface px-1 font-mono text-[12px] text-ink outline-none ring-1 ring-accent"
    />
  );
}

function AddRow({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await onAdd(title.trim());
      setTitle("");
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="flex h-full w-full items-center gap-2 px-3 text-left text-[13px] text-ink-faint hover:bg-row-hover hover:text-ink">
        <IconPlus size={13} /> {tr().taskTable.add}
      </button>
    );
  }
  return (
    <div className="flex h-full items-center gap-2 px-3">
      <IconPlus size={13} className="text-ink-faint" />
      <label htmlFor="inline-add" className="sr-only">
        {tr().taskTable.newTitle}
      </label>
      <input
        id="inline-add"
        autoFocus
        value={title}
        disabled={busy}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") (setEditing(false), setTitle(""));
        }}
        onBlur={() => !title.trim() && setEditing(false)}
        placeholder={tr().taskTable.newTitlePh}
        className="h-7 min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-placeholder"
      />
    </div>
  );
}
