"use client";

import { useState } from "react";
import type { ProjectFeedbackResponse, TaskResponse } from "@/lib/api/schema";
import { FEEDBACK_STATUSES, FEEDBACK_STATUS_LABEL, FEEDBACK_TYPES, FEEDBACK_TYPE_LABEL } from "@/lib/domain/feedback";
import { PRIORITY_LEVELS, PRIORITY_META, priorityToApi } from "@/lib/domain/task";
import { fmtDateTime, fmtDate } from "@/lib/domain/format";
import { useFeedbackMutations } from "@/lib/hooks/feedback";
import { useDialogs } from "@/components/dialogs/DialogProvider";
import { useProjectTasks } from "@/lib/hooks/tasks";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, SearchInput, Select, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/feedback";
import { IconClose, IconPlus } from "@/components/icons";
import { StatusChip } from "@/components/kairso/StatusChip";

export function CreateFeedbackDialog({ open, projectId, onClose }: { open: boolean; projectId: string; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Thêm feedback" width={520}>
      <CreateForm projectId={projectId} onClose={onClose} />
    </Modal>
  );
}

function CreateForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { workspaceId } = useWorkspace();
  const toast = useToast();
  const { create } = useFeedbackMutations(workspaceId, projectId);
  const [f, setF] = useState({ featureName: "", content: "", feedbackType: "feature", priority: priorityToApi(2), submitterName: "", submitterCompany: "" });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const ok = f.featureName.trim() && f.content.trim() && f.submitterName.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        create.mutate(
          { ...f, featureName: f.featureName.trim(), content: f.content.trim(), submitterName: f.submitterName.trim(), submitterCompany: f.submitterCompany.trim() },
          { onSuccess: () => (toast.success("Đã thêm feedback"), onClose()), onError: (e) => toast.error(e) },
        );
      }}
      className="flex flex-col gap-3.5"
    >
      <Field label="Tính năng / chức năng" required>{(p) => <Input {...p} autoFocus value={f.featureName} onChange={(e) => set("featureName", e.target.value)} />}</Field>
      <Field label="Nội dung" required>{(p) => <Textarea {...p} rows={4} value={f.content} onChange={(e) => set("content", e.target.value)} />}</Field>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <Field label="Loại">
          {(p) => (
            <Select {...p} value={f.feedbackType} onChange={(e) => set("feedbackType", e.target.value)}>
              {FEEDBACK_TYPES.map((t) => <option key={t} value={t}>{FEEDBACK_TYPE_LABEL[t]}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Mức ưu tiên">
          {(p) => (
            <Select {...p} value={f.priority} onChange={(e) => set("priority", Number(e.target.value))}>
              {PRIORITY_LEVELS.map((l) => <option key={l} value={PRIORITY_META[l].api}>{PRIORITY_META[l].tag} · {PRIORITY_META[l].label}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Người gửi" required>{(p) => <Input {...p} value={f.submitterName} onChange={(e) => set("submitterName", e.target.value)} />}</Field>
        <Field label="Công ty">{(p) => <Input {...p} value={f.submitterCompany} onChange={(e) => set("submitterCompany", e.target.value)} />}</Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-line pt-3">
        <Button onClick={onClose}>Huỷ</Button>
        <Button type="submit" variant="primary" loading={create.isPending} disabled={!ok}>Thêm</Button>
      </div>
    </form>
  );
}

export function FeedbackDetailDialog({ feedback, projectId, onClose }: { feedback: ProjectFeedbackResponse | null; projectId: string; onClose: () => void }) {
  return (
    <Modal open={!!feedback} onClose={onClose} title={feedback ? `${feedback.code} · ${feedback.featureName}` : ""} width={640}>
      {feedback && <Detail feedback={feedback} projectId={projectId} onClose={onClose} />}
    </Modal>
  );
}

function Detail({ feedback: f, projectId, onClose }: { feedback: ProjectFeedbackResponse; projectId: string; onClose: () => void }) {
  const { workspaceId } = useWorkspace();
  const { openCreateTask } = useDialogs();
  const toast = useToast();
  const { setStatus, respond, link, unlink } = useFeedbackMutations(workspaceId, projectId);
  const [response, setResponse] = useState(f.response ?? "");
  const [fixDate, setFixDate] = useState(f.expectedFixDate ? f.expectedFixDate.slice(0, 10) : "");
  const [q, setQ] = useState("");
  const tasks = useProjectTasks(workspaceId, projectId, { archived: false });
  const err = { onError: (e: unknown) => toast.error(e) };

  const byCode = new Map((tasks.data?.items ?? []).map((t) => [t.code, t]));
  const linkedCodes = new Set((f.tasks ?? []).map((t) => t.code));
  const candidates: TaskResponse[] = (tasks.data?.items ?? [])
    .filter((t) => !linkedCodes.has(t.code) && `${t.code} ${t.title}`.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-4 text-[13px]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{FEEDBACK_TYPE_LABEL[f.feedbackType]}</Badge>
        <Badge>{PRIORITY_META[PRIORITY_LEVELS.find((l) => PRIORITY_META[l].api === f.priority) ?? 3].tag}</Badge>
        <span className="text-ink-muted">{f.submitterName}{f.submitterCompany ? ` · ${f.submitterCompany}` : ""}</span>
        <span className="ml-auto font-mono text-[11.5px] text-ink-faint">{fmtDateTime(f.createdAt)}</span>
      </div>
      <p className="whitespace-pre-wrap rounded-md bg-hover p-3 leading-relaxed text-ink-2">{f.content}</p>
      {(f.images ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(f.images ?? []).map((src) => (
            <a key={src} href={src} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Ảnh đính kèm" className="h-24 rounded-md border border-line object-cover" />
            </a>
          ))}
        </div>
      )}

      <Field label="Trạng thái">
        {(p) => (
          <Select {...p} value={f.status} onChange={(e) => setStatus.mutate({ id: f.id, status: e.target.value as ProjectFeedbackResponse["status"] }, { onSuccess: () => toast.success("Đã đổi trạng thái"), ...err })}>
            {FEEDBACK_STATUSES.map((s) => <option key={s} value={s}>{FEEDBACK_STATUS_LABEL[s]}</option>)}
          </Select>
        )}
      </Field>

      <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
        <p className="text-[12px] font-medium text-ink-2">Phản hồi hiển thị cho khách</p>
        <Textarea aria-label="Phản hồi cho khách" rows={3} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Chưa có phản hồi…" />
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-[12px] text-ink-muted">
            Dự kiến xong
            <input type="date" value={fixDate} onChange={(e) => setFixDate(e.target.value)} className="h-ctl-sm rounded-md border border-line-strong bg-surface px-2 font-mono text-[12px] text-ink" />
          </label>
          <span className="flex-1" />
          {f.respondedAt && <span className="text-[11.5px] text-ink-faint">Đã phản hồi {fmtDate(f.respondedAt)}{f.respondedBy ? ` bởi ${f.respondedBy.name}` : ""}</span>}
          <Button
            size="sm"
            variant="primary"
            loading={respond.isPending}
            disabled={!response.trim()}
            onClick={() => respond.mutate({ id: f.id, body: { response: response.trim(), expectedFixDate: fixDate ? new Date(`${fixDate}T00:00:00`).toISOString() : undefined } }, { onSuccess: () => toast.success("Đã lưu phản hồi"), ...err })}
          >
            Lưu phản hồi
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-medium text-ink-2">Task liên quan</p>
          <span className="flex-1" />
          <Button
            size="sm"
            onClick={() => {
              onClose();
              openCreateTask({ projectId, feedbackId: f.id });
            }}
          >
            <IconPlus size={13} /> Tạo task từ phản hồi
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(f.tasks ?? []).length === 0 && <span className="text-ink-muted">Chưa liên kết task nào.</span>}
          {(f.tasks ?? []).map((t) => {
            const full = byCode.get(t.code);
            return (
              <span key={t.code} className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[12px]">
                <span className="font-mono text-ink-faint">{t.code}</span>
                <StatusChip status={t.status as TaskResponse["status"]} size="sm" />
                {full && (
                  <button type="button" aria-label={`Bỏ liên kết ${t.code}`} onClick={() => unlink.mutate({ id: f.id, taskId: full.id }, err)} className="text-ink-faint hover:text-danger">
                    <IconClose size={11} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="Tìm task để liên kết…" label="Tìm task để liên kết" />
        {q && (
          <ul className="flex flex-col">
            {candidates.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => link.mutate({ id: f.id, taskId: t.id }, { onSuccess: () => setQ(""), ...err })} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-hover">
                  <span className="font-mono text-[11.5px] text-ink-faint">{t.code}</span>
                  <span className="truncate">{t.title}</span>
                </button>
              </li>
            ))}
            {candidates.length === 0 && <li className="px-2 py-2 text-ink-muted">Không có task phù hợp</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
