"use client";

import { useState } from "react";
import type { AttendanceCorrectionRequestResponse } from "@/lib/api/schema";
import { fmtDate, fmtDateTime, fmtTime } from "@/lib/domain/format";
import { useAttendanceMutations, useCheckRequests } from "@/lib/hooks/attendance";
import { useToast } from "@/lib/toast/ToastProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, EmptyState, Skeleton } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";

const TONE = { pending: "warning", approved: "success", rejected: "danger" } as const;
const LABEL = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Bị từ chối" } as const;

const at = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, mi).toISOString();
};

export function CheckRequests({ prefillDate }: { prefillDate?: string }) {
  const { workspaceId, isManager } = useWorkspace();
  const toast = useToast();
  const mine = useCheckRequests(workspaceId, "me");
  const all = useCheckRequests(workspaceId, "all", isManager ? "" : undefined);
  const m = useAttendanceMutations(workspaceId);
  const [open, setOpen] = useState(!!prefillDate);

  const decide = (r: AttendanceCorrectionRequestResponse, approve: boolean) =>
    (approve ? m.approveRequest : m.rejectRequest).mutate(r.id, { onSuccess: () => toast.success(approve ? "Đã duyệt" : "Đã từ chối"), onError: (e) => toast.error(e) });

  return (
    <div className="flex flex-col gap-6">
      {isManager && (
        <section aria-labelledby="cr-all">
          <h2 id="cr-all" className="mb-2 text-[13px] font-semibold">Yêu cầu của thành viên</h2>
          {all.isLoading ? <Skeleton className="h-20" /> : (all.data ?? []).length === 0 ? <EmptyState title="Chưa có yêu cầu nào" className="rounded-lg border border-line bg-surface py-8" /> : (
            <ul className="overflow-hidden rounded-lg border border-line bg-surface">
              {[...(all.data ?? [])].sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1) || b.createdAt.localeCompare(a.createdAt)).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 border-b border-line-row px-4 py-2.5 last:border-b-0">
                  <Avatar person={{ id: r.memberId, name: r.memberName, avatar: r.memberAvatar }} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px]"><span className="font-medium">{r.memberName}</span> · <span className="font-mono text-[12px]">{r.checkInAt ? `vào ${fmtDateTime(r.checkInAt)}` : ""}{r.checkInAt && r.checkOutAt ? " · " : ""}{r.checkOutAt ? `ra ${fmtDateTime(r.checkOutAt)}` : ""}</span></p>
                    <p className="truncate text-[12.5px] text-ink-muted">{r.reason}</p>
                  </div>
                  <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
                  {r.status !== "approved" && <Button size="sm" variant="primary" disabled={m.approveRequest.isPending} onClick={() => decide(r, true)}>Duyệt</Button>}
                  {r.status !== "rejected" && <Button size="sm" variant="danger" disabled={m.rejectRequest.isPending} onClick={() => decide(r, false)}>Từ chối</Button>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <section aria-labelledby="cr-mine">
        <div className="mb-2 flex items-center"><h2 id="cr-mine" className="text-[13px] font-semibold">Yêu cầu của tôi</h2><span className="flex-1" /><Button size="sm" variant="primary" onClick={() => setOpen(true)}>Gửi yêu cầu bổ sung công</Button></div>
        {mine.isLoading ? <Skeleton className="h-20" /> : (mine.data ?? []).length === 0 ? <EmptyState title="Bạn chưa gửi yêu cầu nào" className="rounded-lg border border-line bg-surface py-8" /> : (
          <ul className="overflow-hidden rounded-lg border border-line bg-surface">
            {(mine.data ?? []).map((r) => (
              <li key={r.id} className="flex items-center gap-3 border-b border-line-row px-4 py-2.5 last:border-b-0">
                <div className="min-w-0 flex-1"><p className="font-mono text-[12.5px]">{r.checkInAt ? `Vào ${fmtDate(r.checkInAt)} ${fmtTime(r.checkInAt)}` : ""} {r.checkOutAt ? `· Ra ${fmtTime(r.checkOutAt)}` : ""}</p><p className="truncate text-[12.5px] text-ink-muted">{r.reason}</p></div>
                <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Modal open={open} onClose={() => setOpen(false)} title="Yêu cầu bổ sung công" width={480}><RequestForm prefillDate={prefillDate} onClose={() => setOpen(false)} /></Modal>
    </div>
  );
}

function RequestForm({ prefillDate, onClose }: { prefillDate?: string; onClose: () => void }) {
  const { workspaceId } = useWorkspace();
  const toast = useToast();
  const m = useAttendanceMutations(workspaceId);
  const [date, setDate] = useState(prefillDate ?? "");
  const [inT, setIn] = useState("08:00");
  const [outT, setOut] = useState("17:00");
  const [useIn, setUseIn] = useState(true);
  const [useOut, setUseOut] = useState(true);
  const [reason, setReason] = useState("");
  const bad = useIn && useOut && outT <= inT;
  const ok = date && reason.trim() && (useIn || useOut) && !bad;
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!ok) return;
      m.submitRequest.mutate({ reason: reason.trim(), checkInAt: useIn ? at(date, inT) : undefined, checkOutAt: useOut ? at(date, outT) : undefined }, { onSuccess: () => (toast.success("Đã gửi yêu cầu"), onClose()), onError: (er) => toast.error(er) });
    }} className="flex flex-col gap-3.5">
      <Field label="Ngày" required>{(p) => <Input {...p} type="date" max={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1 flex items-center gap-2 text-[12px] font-medium text-ink-2"><input type="checkbox" checked={useIn} onChange={(e) => setUseIn(e.target.checked)} className="size-4 accent-[var(--accent)]" /> Giờ vào</label><Input type="time" aria-label="Giờ vào" disabled={!useIn} value={inT} onChange={(e) => setIn(e.target.value)} /></div>
        <div><label className="mb-1 flex items-center gap-2 text-[12px] font-medium text-ink-2"><input type="checkbox" checked={useOut} onChange={(e) => setUseOut(e.target.checked)} className="size-4 accent-[var(--accent)]" /> Giờ ra</label><Input type="time" aria-label="Giờ ra" disabled={!useOut} invalid={bad} value={outT} onChange={(e) => setOut(e.target.value)} /></div>
      </div>
      {bad && <p role="alert" className="text-[12px] text-danger">Giờ ra phải sau giờ vào.</p>}
      <Field label="Lý do" required>{(p) => <Textarea {...p} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Quên chấm công, mất kết nối mạng…" />}</Field>
      <div className="flex justify-end gap-2"><Button onClick={onClose}>Huỷ</Button><Button type="submit" variant="primary" loading={m.submitRequest.isPending} disabled={!ok}>Gửi</Button></div>
    </form>
  );
}
