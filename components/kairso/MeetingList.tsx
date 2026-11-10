"use client";

import { useMeeting, useMeetingMutations, useMeetings } from "@/lib/hooks/meetings";
import type { ResourceScope } from "@/lib/hooks/resources";
import { meetingSummary } from "@/lib/domain/meeting";
import { fmtDate } from "@/lib/domain/format";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { useToast } from "@/lib/toast/ToastProvider";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { useConfirm } from "@/components/ui/Confirm";
import { IconCalendar, IconPlus, IconTrash } from "@/components/icons";
import { MeetingEditor } from "./MeetingEditor";

export function MeetingList({ scope }: { scope: ResourceScope }) {
  const q = useMeetings(scope);
  const { remove } = useMeetingMutations(scope);
  const toast = useToast();
  const confirm = useConfirm();
  const [open, setOpen] = useUrlState("meeting");

  return (
    <div>
      {q.isLoading ? (
        <div className="p-3"><Skeleton className="h-9" /></div>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState title="Chưa có biên bản họp" description="Ghi lại hạng mục đã triển khai, yêu cầu mới và việc cần làm theo từng phân hệ." className="py-8" />
      ) : (
        <ul>
          {q.data.map((m) => (
            <li key={m.id} className="group flex min-h-11 items-center gap-2.5 border-b border-line-row px-3 py-1.5 last:border-b-0">
              <IconCalendar size={14} className="shrink-0 text-ink-faint" />
              <button type="button" onClick={() => setOpen(m.id)} className="min-w-0 flex-1 text-left">
                <span className="flex items-baseline gap-2">
                  <span className="truncate text-[13px] font-medium text-ink">{m.title}</span>
                  <span className="shrink-0 font-mono text-[11.5px] text-ink-faint">{fmtDate(m.meetingDate)}</span>
                </span>
                <span className="block truncate text-[11.5px] text-ink-faint">{meetingSummary(m)}</span>
              </button>
              <IconButton
                label={`Xoá biên bản ${m.title}`}
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (await confirm({ title: "Xoá biên bản họp?", message: m.title, danger: true })) remove.mutate(m.id, { onError: (e) => toast.error(e) });
                }}
              >
                <IconTrash size={13} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-line p-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen("new")}><IconPlus size={13} /> Biên bản mới</Button>
      </div>
      <MeetingDialog scope={scope} id={open || null} onOpen={setOpen} onClose={() => setOpen(null)} />
    </div>
  );
}

function MeetingDialog({ scope, id, onOpen, onClose }: { scope: ResourceScope; id: string | null; onOpen: (id: string) => void; onClose: () => void }) {
  const isNew = id === "new";
  const q = useMeeting(isNew ? null : id);
  return (
    <Modal open={!!id} onClose={onClose} title={isNew ? "Biên bản họp mới" : q.data?.title ?? "Biên bản họp"} width={1180}>
      {isNew ? (
        <MeetingEditor scope={scope} meeting={null} onClose={onClose} onCreated={onOpen} />
      ) : q.isLoading ? (
        <Skeleton className="h-40" />
      ) : q.isError || !q.data ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <MeetingEditor key={q.data.id} scope={scope} meeting={q.data} onClose={onClose} onCreated={onOpen} />
      )}
    </Modal>
  );
}
