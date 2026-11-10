"use client";

import { useState } from "react";
import type { FeedbackResponse, InitiativeResponse } from "@/lib/api/schema";
import { INITIATIVE_LABEL, INITIATIVE_STATUSES, INITIATIVE_TONE } from "@/lib/domain/performance";
import { fmtDate, fmtRelative } from "@/lib/domain/format";
import { useCustomerFeedbacks, useInitiatives, usePerformanceMutations } from "@/lib/hooks/performance";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, EmptyState, ErrorState, SkeletonRows } from "@/components/ui/feedback";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/Confirm";
import { IconBulb, IconChat, IconEdit, IconPlus, IconTrash } from "@/components/icons";

export default function InitiativesPage() {
  const [tab, setTab] = useUrlState("tab", "initiatives");
  const isFb = tab === "feedbacks";
  return (
    <>
      <TopBar><Breadcrumb items={[{ label: "Sáng kiến" }]} /><TopBarSpacer /></TopBar>
      <Tabs label="Sáng kiến và phản hồi khách hàng" value={isFb ? "feedbacks" : "initiatives"} onChange={(v) => setTab(v === "initiatives" ? null : v)} className="bg-surface px-3" tabs={[{ value: "initiatives", label: "Sáng kiến" }, { value: "feedbacks", label: "Phản hồi khách hàng" }]} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1000px] p-5 max-sm:p-3">{isFb ? <Feedbacks /> : <Initiatives />}</div>
      </div>
    </>
  );
}

function Initiatives() {
  const { workspaceId, isManager } = useWorkspace();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useUrlState("status", "");
  const q = useInitiatives(workspaceId, { status: status || undefined });
  const { updateInitiative, deleteInitiative } = usePerformanceMutations(workspaceId);
  const [edit, setEdit] = useState<InitiativeResponse | "new" | null>(null);
  const list = q.data ?? [];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Select small aria-label="Lọc trạng thái" className="w-44" value={status} onChange={(e) => setStatus(e.target.value || null)}>
          <option value="">Mọi trạng thái</option>
          {INITIATIVE_STATUSES.map((s) => <option key={s} value={s}>{INITIATIVE_LABEL[s]}</option>)}
        </Select>
        <span className="flex-1" />
        <Button size="sm" variant="primary" onClick={() => setEdit("new")}><IconPlus size={13} /> Đề xuất sáng kiến</Button>
      </div>
      {q.isLoading ? <SkeletonRows rows={5} height={72} /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : list.length === 0 ? (
        <EmptyState icon={<IconBulb size={28} />} title="Chưa có sáng kiến" description="Đề xuất cải tiến để được ghi nhận vào KPI." className="rounded-lg border border-line bg-surface py-12" />
      ) : (
        <ul className="overflow-hidden rounded-lg border border-line bg-surface">
          {list.map((i) => (
            <li key={i.id} className="flex items-start gap-3 border-b border-line-row px-4 py-3 last:border-b-0">
              <Avatar person={{ id: i.proposer.id, name: i.proposer.name, avatar: i.proposer.avatar }} size="md" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[13px]"><span className="font-semibold">{i.proposer.name}</span><Badge tone={INITIATIVE_TONE[i.status]}>{INITIATIVE_LABEL[i.status]}</Badge><span className="text-[11.5px] text-ink-faint">{fmtRelative(i.createdAt)}</span></p>
                <p className="whitespace-pre-wrap break-words text-[13px] text-ink-2">{i.content}</p>
                <p className="mt-1 text-[12px] text-ink-muted">Người liên quan: {i.refMember.name} · Ước tính <span className="font-mono">{i.estimate}h</span>{i.earliestApprovalDate ? ` · Duyệt sớm nhất ${fmtDate(i.earliestApprovalDate)}` : ""}</p>
                {i.changesAfter && <p className="mt-1 rounded-md bg-hover px-2 py-1 text-[12.5px]"><span className="font-medium">Sau thay đổi:</span> {i.changesAfter}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {isManager && (
                  <Select small aria-label="Đổi trạng thái" className="w-36" value={i.status} onChange={(e) => updateInitiative.mutate({ id: i.id, body: { status: e.target.value as InitiativeResponse["status"] } }, { onError: (er) => toast.error(er) })}>
                    {INITIATIVE_STATUSES.map((s) => <option key={s} value={s}>{INITIATIVE_LABEL[s]}</option>)}
                  </Select>
                )}
                {(isManager || i.proposer.id === user?.id) && (
                  <>
                    <IconButton label="Sửa" variant="ghost" size="sm" onClick={() => setEdit(i)}><IconEdit size={13} /></IconButton>
                    <IconButton label="Xoá" variant="ghost" size="sm" onClick={async () => { if (await confirm({ title: "Xoá sáng kiến?", danger: true })) deleteInitiative.mutate(i.id, { onError: (e) => toast.error(e) }); }}><IconTrash size={13} /></IconButton>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Đề xuất sáng kiến" : "Sửa sáng kiến"} width={520}>{edit && <InitiativeForm item={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}</Modal>
    </div>
  );
}

function InitiativeForm({ item, onClose }: { item: InitiativeResponse | null; onClose: () => void }) {
  const { workspaceId, members } = useWorkspace();
  const toast = useToast();
  const { createInitiative, updateInitiative } = usePerformanceMutations(workspaceId);
  const [content, setContent] = useState(item?.content ?? "");
  const [ref, setRef] = useState(item?.refMember.id ?? "");
  const [estimate, setEstimate] = useState(String(item?.estimate ?? 0));
  const [date, setDate] = useState(item?.earliestApprovalDate?.slice(0, 10) ?? "");
  const [after, setAfter] = useState(item?.changesAfter ?? "");
  const ok = content.trim() && ref && Number(estimate) >= 0;
  const done = { onSuccess: () => (toast.success("Đã lưu"), onClose()), onError: (e: unknown) => toast.error(e) };
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!ok) return;
      const body = { content: content.trim(), refMemberId: ref, estimate: Number(estimate), earliestApprovalDate: date ? new Date(`${date}T00:00:00`).toISOString() : undefined };
      if (item) updateInitiative.mutate({ id: item.id, body: { ...body, changesAfter: after.trim() || undefined } }, done);
      else createInitiative.mutate(body, done);
    }} className="flex flex-col gap-3.5">
      <Field label="Nội dung sáng kiến" required>{(p) => <Textarea {...p} autoFocus rows={4} value={content} onChange={(e) => setContent(e.target.value)} />}</Field>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <Field label="Người liên quan" required>{(p) => <Select {...p} value={ref} onChange={(e) => setRef(e.target.value)}><option value="">Chọn…</option>{members.map((m) => <option key={m.userId} value={m.userId}>{m.userName}</option>)}</Select>}</Field>
        <Field label="Ước tính (giờ)" required>{(p) => <Input {...p} type="number" min={0} className="font-mono" value={estimate} onChange={(e) => setEstimate(e.target.value)} />}</Field>
        <Field label="Duyệt sớm nhất">{(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
      </div>
      {item && <Field label="Thay đổi sau khi áp dụng">{(p) => <Textarea {...p} rows={2} value={after} onChange={(e) => setAfter(e.target.value)} />}</Field>}
      <div className="flex justify-end gap-2"><Button onClick={onClose}>Huỷ</Button><Button type="submit" variant="primary" loading={createInitiative.isPending || updateInitiative.isPending} disabled={!ok}>Lưu</Button></div>
    </form>
  );
}

function Feedbacks() {
  const { workspaceId, isManager } = useWorkspace();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const q = useCustomerFeedbacks(workspaceId);
  const { deleteFeedback } = usePerformanceMutations(workspaceId);
  const [edit, setEdit] = useState<FeedbackResponse | "new" | null>(null);
  const list = q.data ?? [];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex"><span className="flex-1" /><Button size="sm" variant="primary" onClick={() => setEdit("new")}><IconPlus size={13} /> Ghi nhận phản hồi</Button></div>
      {q.isLoading ? <SkeletonRows rows={5} height={72} /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : list.length === 0 ? (
        <EmptyState icon={<IconChat size={28} />} title="Chưa có phản hồi khách hàng" className="rounded-lg border border-line bg-surface py-12" />
      ) : (
        <ul className="overflow-hidden rounded-lg border border-line bg-surface">
          {list.map((f) => (
            <li key={f.id} className="flex items-start gap-3 border-b border-line-row px-4 py-3 last:border-b-0">
              <Avatar person={{ id: f.creator.id, name: f.creator.name, avatar: f.creator.avatar }} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px]"><span className="font-semibold">{f.creator.name}</span> <span className="text-[11.5px] text-ink-faint">{fmtRelative(f.createdAt)}</span></p>
                <p className="whitespace-pre-wrap text-[13px] text-ink-2">{f.content}</p>
                {f.feedbackText && <p className="mt-1 rounded-md bg-hover px-2 py-1 text-[12.5px] italic text-ink-2">“{f.feedbackText}”</p>}
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">Hưởng lợi: {(f.beneficiaries ?? []).map((b) => `${b.name} ×${b.weight}`).join(", ") || "—"} · <span className="font-mono">{f.estimate}h</span></p>
              </div>
              {(isManager || f.creator.id === user?.id) && (
                <span className="flex">
                  <IconButton label="Sửa" variant="ghost" size="sm" onClick={() => setEdit(f)}><IconEdit size={13} /></IconButton>
                  <IconButton label="Xoá" variant="ghost" size="sm" onClick={async () => { if (await confirm({ title: "Xoá phản hồi?", danger: true })) deleteFeedback.mutate(f.id, { onError: (e) => toast.error(e) }); }}><IconTrash size={13} /></IconButton>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Ghi nhận phản hồi khách hàng" : "Sửa phản hồi"} width={520}>{edit && <FeedbackForm item={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}</Modal>
    </div>
  );
}

function FeedbackForm({ item, onClose }: { item: FeedbackResponse | null; onClose: () => void }) {
  const { workspaceId, members } = useWorkspace();
  const toast = useToast();
  const { createFeedback, updateFeedback } = usePerformanceMutations(workspaceId);
  const [content, setContent] = useState(item?.content ?? "");
  const [text, setText] = useState(item?.feedbackText ?? "");
  const [estimate, setEstimate] = useState(String(item?.estimate ?? 0));
  const [ben, setBen] = useState<Record<string, number>>(Object.fromEntries((item?.beneficiaries ?? []).map((b) => [b.id, b.weight])));
  const ok = content.trim() && Object.keys(ben).length > 0 && Number(estimate) >= 0;
  const done = { onSuccess: () => (toast.success("Đã lưu"), onClose()), onError: (e: unknown) => toast.error(e) };
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!ok) return;
      const body = { content: content.trim(), feedbackText: text.trim(), estimate: Number(estimate), beneficiaries: Object.entries(ben).map(([userId, weight]) => ({ userId, weight })) };
      if (item) updateFeedback.mutate({ id: item.id, body }, done);
      else createFeedback.mutate(body, done);
    }} className="flex flex-col gap-3.5">
      <Field label="Nội dung" required>{(p) => <Textarea {...p} autoFocus rows={3} value={content} onChange={(e) => setContent(e.target.value)} />}</Field>
      <Field label="Lời khách hàng">{(p) => <Textarea {...p} rows={2} value={text} onChange={(e) => setText(e.target.value)} />}</Field>
      <Field label="Ước tính (giờ)" required>{(p) => <Input {...p} type="number" min={0} className="w-28 font-mono" value={estimate} onChange={(e) => setEstimate(e.target.value)} />}</Field>
      <fieldset>
        <legend className="mb-1 text-[12px] font-medium text-ink-2">Người được hưởng (kèm tỉ trọng)</legend>
        <ul className="max-h-[200px] overflow-y-auto rounded-md border border-line">
          {members.map((m) => {
            const on = m.userId in ben;
            return (
              <li key={m.userId} className="flex h-9 items-center gap-2 border-b border-line-row px-2 last:border-b-0">
                <input type="checkbox" id={`b-${m.userId}`} checked={on} onChange={() => setBen((b) => { const n = { ...b }; if (on) delete n[m.userId]; else n[m.userId] = 1; return n; })} className="size-4 accent-[var(--accent)]" />
                <label htmlFor={`b-${m.userId}`} className="flex-1 cursor-pointer text-[13px]">{m.userName}</label>
                {on && <input type="number" min={1} aria-label={`Tỉ trọng ${m.userName}`} value={ben[m.userId]} onChange={(e) => setBen((b) => ({ ...b, [m.userId]: Math.max(1, Number(e.target.value) || 1) }))} className="h-6 w-14 rounded border border-line-strong bg-surface px-1 text-center font-mono text-[12px]" />}
              </li>
            );
          })}
        </ul>
      </fieldset>
      <div className="flex justify-end gap-2"><Button onClick={onClose}>Huỷ</Button><Button type="submit" variant="primary" loading={createFeedback.isPending || updateFeedback.isPending} disabled={!ok}>Lưu</Button></div>
    </form>
  );
}
