"use client";

import { useState } from "react";
import type { ModuleResponse, TaskResponse, TaskStatus } from "@/lib/api/schema";
import { STATUS_META, TASK_STATUSES } from "@/lib/domain/task";
import { useUpdateTask } from "@/lib/hooks/tasks";
import { useToast } from "@/lib/toast/ToastProvider";
import { AvatarGroup } from "@/components/ui/Avatar";
import { PriorityTag } from "@/components/kairso/PriorityTag";
import { DueDate } from "@/components/kairso/DueDate";
import { ModuleChip } from "@/components/kairso/ModuleChip";
import { StatusPicker } from "@/components/kairso/pickers";
import { IconPlus } from "@/components/icons";
import { useDialogs } from "@/components/dialogs/DialogProvider";

export function BoardView({
  tasks,
  modules,
  projectId,
  selectedId,
  onOpen,
}: {
  tasks: TaskResponse[];
  modules: ModuleResponse[];
  projectId: string;
  selectedId?: string | null;
  onOpen: (t: TaskResponse) => void;
}) {
  const update = useUpdateTask();
  const toast = useToast();
  const { openCreateTask } = useDialogs();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);

  const moduleName = new Map(modules.map((m) => [m.id, m.name]));
  const statuses = TASK_STATUSES.filter((s) => s !== "canceled" || tasks.some((t) => t.status === "canceled"));

  const move = (id: string, status: TaskStatus) => {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === status) return;
    update.mutate({ id, patch: { status } }, { onError: (e) => toast.error(e) });
  };

  return (
    <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4">
      {statuses.map((s) => {
        const col = tasks.filter((t) => t.status === s);
        const meta = STATUS_META[s];
        return (
          <section
            key={s}
            aria-label={meta.label}
            onDragOver={(e) => (e.preventDefault(), setOver(s))}
            onDragLeave={() => setOver((o) => (o === s ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              if (dragId) move(dragId, s);
              setDragId(null);
            }}
            style={{ background: `color-mix(in srgb, ${meta.dot} 7%, var(--surface))`, borderTopColor: meta.dot }}
            className={`flex w-[280px] shrink-0 flex-col rounded-xl border border-t-[3px] shadow-sm ${over === s ? "border-accent ring-2 ring-accent-border" : "border-line"}`}
          >
            <header className="flex h-10 items-center gap-2 px-3">
              <span className="size-2.5 rounded-full" style={{ background: meta.dot }} aria-hidden="true" />
              <h3 className="text-[13px] font-semibold" style={{ color: meta.fg }}>{meta.label}</h3>
              <span className="rounded-full px-1.5 font-mono text-[11px] font-semibold" style={{ background: meta.bg, color: meta.fg }}>{col.length}</span>
              <span className="flex-1" />
              <button type="button" aria-label={`Thêm task vào ${meta.label}`} onClick={() => openCreateTask({ projectId, status: s })} className="text-ink-faint hover:text-ink">
                <IconPlus size={14} />
              </button>
            </header>
            <ul className="flex min-h-[60px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
              {col.map((t) => (
                <li
                  key={t.id}
                  draggable
                  onDragStart={(e) => (e.dataTransfer.effectAllowed = "move", setDragId(t.id))}
                  onDragEnd={() => (setDragId(null), setOver(null))}
                  style={{ borderLeftColor: meta.dot }}
                  className={`rounded-lg border border-l-[3px] bg-surface p-2.5 shadow-sm transition-shadow ${t.id === selectedId ? "border-y-accent border-r-accent ring-1 ring-accent" : "border-y-line border-r-line"} ${dragId === t.id ? "opacity-50" : "hover:shadow-md"}`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-[11px] text-ink-faint">{t.code}</span>
                    <PriorityTag priority={t.priority} showLabel={false} />
                    <span className="flex-1" />
                    <StatusPicker bare value={t.status} onChange={(st) => move(t.id, st)} />
                  </div>
                  <button type="button" onClick={() => onOpen(t)} className="line-clamp-3 w-full text-left text-[13px] font-medium leading-snug text-ink hover:text-accent-ink">
                    {t.title}
                  </button>
                  <div className="mt-2 flex items-center gap-2">
                    {t.moduleId && <ModuleChip name={moduleName.get(t.moduleId)} />}
                    <span className="flex-1" />
                    <DueDate date={t.endDate} status={t.status} />
                    <AvatarGroup people={(t.workers ?? []).map((w) => ({ id: w.user.id, name: w.user.name, avatar: w.user.avatar }))} max={2} />
                  </div>
                </li>
              ))}
              {col.length === 0 && <li className="rounded-md border border-dashed border-line-strong py-5 text-center text-[12px] text-ink-faint">Kéo thẻ vào đây</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
