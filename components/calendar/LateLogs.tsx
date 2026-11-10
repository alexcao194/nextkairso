"use client";

import { useState } from "react";
import type { LateLogResponse } from "@/lib/api/schema";
import { fmtDateTime } from "@/lib/domain/format";
import { useLateLogs, usePerformanceMutations } from "@/lib/hooks/performance";
import { useToast } from "@/lib/toast/ToastProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/Confirm";
import { IconClock, IconEdit, IconPlus, IconTrash } from "@/components/icons";

const toLocalInput = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date();
  const p = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function LateLogs() {
  const { workspaceId, isManager } = useWorkspace();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const q = useLateLogs(workspaceId);
  const { deleteLateLog } = usePerformanceMutations(workspaceId);
  const [edit, setEdit] = useState<LateLogResponse | "new" | null>(null);
  const list = q.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center"><h2 className="text-[13px] font-semibold">Nhật ký đi muộn ({list.length})</h2><span className="flex-1" /><Button size="sm" variant="primary" onClick={() => setEdit("new")}><IconPlus size={13} /> Ghi nhận</Button></div>
      {q.isLoading ? <Skeleton className="h-32" /> : list.length === 0 ? <EmptyState icon={<IconClock size={26} />} title="Chưa có ghi nhận nào" className="rounded-lg border border-line bg-surface py-10" /> : (
        <ul className="overflow-hidden rounded-lg border border-line bg-surface">
          {list.map((l) => (
            <li key={l.id} className="flex items-start gap-3 border-b border-line-row px-4 py-3 last:border-b-0">
              <Avatar person={{ id: l.lateUser.id, name: l.lateUser.name, avatar: l.lateUser.avatar }} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px]"><span className="font-semibold">{l.lateUser.name}</span> <span className="font-mono text-[12px] text-ink-muted">· {fmtDateTime(l.lateTime)}</span></p>
                <p className="whitespace-pre-wrap break-words text-[12.5px] text-ink-2">{l.content}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-faint">Ghi bởi {l.creator.name}</p>
              </div>
              <span className="font-mono text-[12.5px] font-medium">{l.estimate}h</span>
              {(isManager || l.creator.id === user?.id) && (
                <span className="flex">
                  <IconButton label="Sửa" variant="ghost" size="sm" onClick={() => setEdit(l)}><IconEdit size={13} /></IconButton>
                  <IconButton label="Xoá" variant="ghost" size="sm" onClick={async () => { if (await confirm({ title: "Xoá ghi nhận?", danger: true })) deleteLateLog.mutate(l.id, { onError: (e) => toast.error(e) }); }}><IconTrash size={13} /></IconButton>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Ghi nhận đi muộn" : "Sửa ghi nhận"} width={480}>{edit && <Form log={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}</Modal>
    </div>
  );
}

function Form({ log, onClose }: { log: LateLogResponse | null; onClose: () => void }) {
  const { workspaceId, members } = useWorkspace();
  const toast = useToast();
  const { createLateLog, updateLateLog } = usePerformanceMutations(workspaceId);
  const [userId, setUserId] = useState(log?.lateUser.id ?? "");
  const [when, setWhen] = useState(toLocalInput(log?.lateTime));
  const [estimate, setEstimate] = useState(String(log?.estimate ?? 0));
  const [content, setContent] = useState(log?.content ?? "");
  const ok = (log || userId) && when && content.trim() && Number(estimate) >= 0;
  const done = { onSuccess: () => (toast.success("Đã lưu"), onClose()), onError: (e: unknown) => toast.error(e) };
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!ok) return;
      const base = { content: content.trim(), estimate: Number(estimate), lateTime: new Date(when).toISOString() };
      if (log) updateLateLog.mutate({ id: log.id, body: base }, done);
      else createLateLog.mutate({ ...base, lateUserId: userId }, done);
    }} className="flex flex-col gap-3.5">
      {!log && <Field label="Người đi muộn" required>{(p) => <Select {...p} value={userId} onChange={(e) => setUserId(e.target.value)}><option value="">Chọn thành viên…</option>{members.map((m) => <option key={m.userId} value={m.userId}>{m.userName}</option>)}</Select>}</Field>}
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <Field label="Thời điểm" required>{(p) => <Input {...p} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}</Field>
        <Field label="Ước tính (giờ)" required>{(p) => <Input {...p} type="number" min={0} step="0.5" className="font-mono" value={estimate} onChange={(e) => setEstimate(e.target.value)} />}</Field>
      </div>
      <Field label="Nội dung" required>{(p) => <Textarea {...p} rows={3} value={content} onChange={(e) => setContent(e.target.value)} />}</Field>
      <div className="flex justify-end gap-2"><Button onClick={onClose}>Huỷ</Button><Button type="submit" variant="primary" loading={createLateLog.isPending || updateLateLog.isPending} disabled={!ok}>Lưu</Button></div>
    </form>
  );
}
