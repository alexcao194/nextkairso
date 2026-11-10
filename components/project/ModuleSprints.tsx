"use client";

import { useState } from "react";
import type { ModuleResponse } from "@/lib/api/schema";
import {
  SPRINT_STATUS_COLOR,
  SPRINT_STATUS_LABEL,
  activeSprint,
  isSprintOverdue,
  nextSprintDraft,
  sprintDays,
  sprintProblem,
  type ModuleSprint,
} from "@/lib/domain/module";
import { useSprintMutations } from "@/lib/hooks/modules";
import { useToast } from "@/lib/toast/ToastProvider";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import { useConfirm } from "@/components/ui/Confirm";
import { IconEdit, IconPlay, IconPlus, IconTrash, IconCheck } from "@/components/icons";

const ddmm = (k: string) => `${k.slice(8, 10)}/${k.slice(5, 7)}`;

type Editing = { kind: "new" } | { kind: "edit" | "finish"; id: string } | null;

export function ModuleSprints({ module }: { module: ModuleResponse }) {
  const sprints = module.sprints ?? [];
  const running = activeSprint(module);
  const { create, update, remove } = useSprintMutations(module.id);
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Editing>(null);
  const err = (e: unknown) => toast.error(e);

  return (
    <div className="flex flex-col gap-2">
      {sprints.length === 0 && editing?.kind !== "new" && (
        <EmptyState title="Chưa có sprint" description="Chia module thành các sprint ngắn (thường 2 tuần, tối đa 1 tháng), mỗi sprint có một Sprint Goal." className="py-6" />
      )}
      <ol className="flex flex-col gap-2">
        {sprints.map((s) =>
          editing && editing.kind !== "new" && editing.id === s.id ? (
            <li key={s.id}>
              <SprintForm
                sprint={s}
                all={sprints}
                finishing={editing.kind === "finish"}
                busy={update.isPending}
                onCancel={() => setEditing(null)}
                onSave={(body) =>
                  update.mutate(
                    { id: s.id, body: editing.kind === "finish" ? { ...body, status: "completed" } : body },
                    { onSuccess: () => (setEditing(null), toast.success(editing.kind === "finish" ? `Đã kết thúc ${s.name}` : "Đã lưu sprint")), onError: err },
                  )
                }
              />
            </li>
          ) : (
            <SprintCard
              key={s.id}
              sprint={s}
              blockedStart={running && running.id !== s.id ? `${running.name} đang chạy — kết thúc trước` : null}
              onStart={() => update.mutate({ id: s.id, body: { status: "active" } }, { onSuccess: () => toast.success(`Đã bắt đầu ${s.name}`), onError: err })}
              onFinish={() => setEditing({ kind: "finish", id: s.id })}
              onEdit={() => setEditing({ kind: "edit", id: s.id })}
              onDelete={async () => {
                if (await confirm({ title: `Xoá ${s.name}?`, message: s.goal || undefined, danger: true })) remove.mutate(s.id, { onError: err });
              }}
            />
          ),
        )}
      </ol>
      {editing?.kind === "new" ? (
        <SprintForm
          sprint={{ id: "", goal: "", reviewNote: "", retroNote: "", status: "planned", ...nextSprintDraft(module) }}
          all={sprints}
          busy={create.isPending}
          onCancel={() => setEditing(null)}
          onSave={(b) => create.mutate({ name: b.name, goal: b.goal, startDate: b.startDate, endDate: b.endDate }, { onSuccess: () => (setEditing(null), toast.success("Đã thêm sprint")), onError: err })}
        />
      ) : (
        <div>
          <Button size="sm" variant="ghost" onClick={() => setEditing({ kind: "new" })}><IconPlus size={13} /> Thêm sprint</Button>
        </div>
      )}
    </div>
  );
}

function SprintCard({
  sprint: s,
  blockedStart,
  onStart,
  onFinish,
  onEdit,
  onDelete,
}: {
  sprint: ModuleSprint;
  blockedStart: string | null;
  onStart: () => void;
  onFinish: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const overdue = isSprintOverdue(s);
  return (
    <li className="flex flex-col gap-1.5 rounded-lg border border-line p-3" style={s.status === "active" ? { borderColor: SPRINT_STATUS_COLOR.active } : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold">{s.name}</span>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
          <span className="size-2 rounded-full" style={{ background: SPRINT_STATUS_COLOR[s.status] }} aria-hidden="true" />
          {SPRINT_STATUS_LABEL[s.status]}
        </span>
        <span className={`font-mono text-[12px] ${overdue ? "font-medium text-danger" : "text-ink-muted"}`}>
          {ddmm(s.startDate)} → {ddmm(s.endDate)} · {sprintDays(s)} ngày{overdue && " · quá hạn, cần kết thúc"}
        </span>
        <span className="flex-1" />
        {s.status === "planned" && (
          <Button size="sm" variant="primary" disabled={!!blockedStart} title={blockedStart ?? undefined} onClick={onStart}>
            <IconPlay size={12} /> Bắt đầu sprint
          </Button>
        )}
        {s.status === "active" && (
          <Button size="sm" variant="primary" onClick={onFinish}>
            <IconCheck size={13} /> Kết thúc sprint
          </Button>
        )}
        <IconButton label={`Sửa ${s.name}`} variant="ghost" size="sm" onClick={onEdit}><IconEdit size={13} /></IconButton>
        <IconButton label={`Xoá ${s.name}`} variant="ghost" size="sm" onClick={onDelete}><IconTrash size={13} /></IconButton>
      </div>
      {s.goal ? <p className="text-[12.5px] text-ink-2"><span className="text-ink-faint">Sprint Goal:</span> {s.goal}</p> : s.status !== "completed" && <p className="text-[12px] text-ink-faint">Chưa có Sprint Goal.</p>}
      {s.reviewNote && <p className="whitespace-pre-line text-[12.5px] text-ink-2"><span className="text-ink-faint">Review:</span> {s.reviewNote}</p>}
      {s.retroNote && <p className="whitespace-pre-line text-[12.5px] text-ink-2"><span className="text-ink-faint">Retrospective:</span> {s.retroNote}</p>}
    </li>
  );
}

interface SprintDraft {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  reviewNote: string;
  retroNote: string;
}

function SprintForm({
  sprint,
  all,
  finishing = false,
  busy,
  onSave,
  onCancel,
}: {
  sprint: Pick<ModuleSprint, "id" | "name" | "goal" | "startDate" | "endDate" | "reviewNote" | "retroNote" | "status">;
  all: ModuleSprint[];
  finishing?: boolean;
  busy: boolean;
  onSave: (b: SprintDraft) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<SprintDraft>({ name: sprint.name, goal: sprint.goal, startDate: sprint.startDate, endDate: sprint.endDate, reviewNote: sprint.reviewNote, retroNote: sprint.retroNote });
  const set = <K extends keyof SprintDraft>(k: K, v: string) => setD((x) => ({ ...x, [k]: v }));
  const problem = sprintProblem({ id: sprint.id, startDate: d.startDate, endDate: d.endDate }, all);
  const showNotes = finishing || sprint.status !== "planned";
  const ok = !!d.name.trim() && !problem;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (ok) onSave({ ...d, name: d.name.trim(), goal: d.goal.trim(), reviewNote: d.reviewNote.trim(), retroNote: d.retroNote.trim() });
      }}
      className="flex flex-col gap-3 rounded-lg border border-accent-border bg-accent-soft/30 p-3"
    >
      {finishing && <p className="text-[12.5px] font-medium">Kết thúc {sprint.name}: ghi lại Sprint Review và Retrospective.</p>}
      <div className="grid grid-cols-[1fr_140px_140px] gap-2 max-sm:grid-cols-1">
        <Field label="Tên sprint" required>{(p) => <Input {...p} small value={d.name} onChange={(e) => set("name", e.target.value)} maxLength={120} />}</Field>
        <Field label="Bắt đầu" required>{(p) => <Input {...p} small type="date" value={d.startDate} onChange={(e) => set("startDate", e.target.value)} />}</Field>
        <Field label="Kết thúc" required>{(p) => <Input {...p} small type="date" min={d.startDate} value={d.endDate} onChange={(e) => set("endDate", e.target.value)} />}</Field>
      </div>
      <Field label="Sprint Goal" hint="Mục tiêu duy nhất của sprint, chốt ở Sprint Planning.">
        {(p) => <Textarea {...p} rows={2} autoFocus={!finishing} value={d.goal} onChange={(e) => set("goal", e.target.value)} placeholder="VD: QC tự điền nguyên nhân NCR trên hệ thống" />}
      </Field>
      {showNotes && (
        <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          <Field label="Sprint Review" hint="Đã demo gì, khách/PO phản hồi gì.">
            {(p) => <Textarea {...p} rows={3} autoFocus={finishing} value={d.reviewNote} onChange={(e) => set("reviewNote", e.target.value)} />}
          </Field>
          <Field label="Retrospective" hint="Giữ gì, bỏ gì, thử gì ở sprint sau.">
            {(p) => <Textarea {...p} rows={3} value={d.retroNote} onChange={(e) => set("retroNote", e.target.value)} />}
          </Field>
        </div>
      )}
      {problem && <p role="alert" className="text-[12px] text-danger">{problem}</p>}
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={onCancel}>Huỷ</Button>
        <Button size="sm" type="submit" variant="primary" loading={busy} disabled={!ok}>
          {finishing ? "Kết thúc sprint" : sprint.id ? "Lưu" : "Thêm sprint"}
        </Button>
      </div>
    </form>
  );
}
