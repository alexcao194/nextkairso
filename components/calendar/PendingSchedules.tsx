"use client";

import { useMemo } from "react";
import { fmtTime } from "@/lib/domain/format";
import { useAttendanceMutations, usePendingSchedules } from "@/lib/hooks/attendance";
import { useToast } from "@/lib/toast/ToastProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { IconCircleCheck } from "@/components/icons";

export function PendingSchedules() {
  const { workspaceId, isManager } = useWorkspace();
  const toast = useToast();
  const q = usePendingSchedules(workspaceId, isManager);
  const m = useAttendanceMutations(workspaceId);
  const groups = useMemo(() => {
    const map = new Map<string, { name?: string; avatar?: string; days: NonNullable<typeof q.data> }>();
    for (const d of q.data ?? []) {
      const g = map.get(d.memberId) ?? { name: d.memberName, avatar: d.memberAvatar, days: [] };
      g.days.push(d);
      map.set(d.memberId, g);
    }
    return [...map.entries()];
  }, [q.data]);
  const done = (msg: string) => ({ onSuccess: () => toast.success(msg), onError: (e: unknown) => toast.error(e) });

  if (!isManager) return <EmptyState title="Chỉ quản lý mới duyệt được lịch" className="py-12" />;
  if (q.isLoading) return <Skeleton className="h-40" />;
  if (groups.length === 0) return <EmptyState icon={<IconCircleCheck size={26} />} title="Không có lịch nào chờ duyệt" className="rounded-lg border border-line bg-surface py-12" />;
  return (
    <ul className="flex flex-col gap-4">
      {groups.map(([memberId, g]) => {
        const weekNote = g.days.map((d) => d.weekNote ?? "").find((n) => n) ?? "";
        return (
        <li key={memberId} className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-4 py-2.5">
            <Avatar person={{ id: memberId, name: g.name, avatar: g.avatar }} size="md" />
            <span className="flex-1 text-[13px] font-semibold">{g.name} <span className="font-normal text-ink-muted">· {g.days.length} ngày</span></span>
            <Button size="sm" variant="primary" loading={m.approveAllSchedules.isPending} onClick={() => m.approveAllSchedules.mutate(memberId, done("Đã duyệt toàn bộ"))}>Duyệt tất cả</Button>
            <Button size="sm" variant="danger" loading={m.rejectSchedules.isPending} onClick={() => m.rejectSchedules.mutate({ memberId, dayIds: g.days.map((d) => d.id) }, done("Đã từ chối"))}>Từ chối tất cả</Button>
            {weekNote && <p className="w-full text-[12.5px] text-ink-muted">Ghi chú đợt: <span className="text-ink-2">{weekNote}</span></p>}
          </div>
          <ul>
            {g.days.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 border-b border-line-row px-4 py-2 last:border-b-0">
                <span className="w-24 font-mono text-[12.5px]">{new Date(d.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}</span>
                <span className="flex-1 font-mono text-[12.5px] text-ink-2">{(d.sessions ?? []).map((s) => `${fmtTime(s.startAt)}–${fmtTime(s.endAt)}`).join("  ·  ")}</span>
                <Button size="sm" onClick={() => m.approveSchedules.mutate({ memberId, dayIds: [d.id] }, done("Đã duyệt"))}>Duyệt</Button>
                <Button size="sm" variant="ghost" onClick={() => m.rejectSchedules.mutate({ memberId, dayIds: [d.id] }, done("Đã từ chối"))}>Từ chối</Button>
                {d.note && <p className="w-full pl-24 text-[12.5px] text-ink-muted">↳ {d.note}</p>}
              </li>
            ))}
          </ul>
        </li>
        );
      })}
    </ul>
  );
}
