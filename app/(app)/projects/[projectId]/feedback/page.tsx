"use client";

import { use, useState } from "react";
import type { ProjectFeedbackResponse } from "@/lib/api/schema";
import { FEEDBACK_STATUSES, FEEDBACK_STATUS_LABEL, FEEDBACK_STATUS_TONE, FEEDBACK_TYPES, FEEDBACK_TYPE_LABEL, FEEDBACK_TYPE_TONE } from "@/lib/domain/feedback";
import { PRIORITY_META, priorityLevel } from "@/lib/domain/task";
import { fmtDate } from "@/lib/domain/format";
import { useFeedbackSettings, useFeedbackSettingsMutations, useProjectFeedbacks } from "@/lib/hooks/feedback";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { Button } from "@/components/ui/Button";
import { SearchInput, Select, Switch } from "@/components/ui/form";
import { Badge, EmptyState, ErrorState, SkeletonRows } from "@/components/ui/feedback";
import { useConfirm } from "@/components/ui/Confirm";
import { CreateFeedbackDialog, FeedbackDetailDialog } from "@/components/project/FeedbackDialogs";
import { IconChat, IconCopy, IconGlobe, IconPlus, IconRefresh } from "@/components/icons";

export default function ProjectFeedbackPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { workspaceId, isManager } = useWorkspace();
  const toast = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useUrlState("status");
  const [type, setType] = useUrlState("type");
  const [q, setQ] = useUrlState("q");
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const list = useProjectFeedbacks(workspaceId, projectId, { status: status || undefined, feedbackType: type || undefined, q: q || undefined });
  const settings = useFeedbackSettings(workspaceId, projectId);
  const sm = useFeedbackSettingsMutations(workspaceId, projectId);
  const items = list.data?.items ?? [];
  const opened: ProjectFeedbackResponse | null = items.find((f) => f.id === open) ?? null;

  const publicUrl = settings.data?.token && typeof window !== "undefined" ? `${window.location.origin}/f/${settings.data.token}` : "";
  const fail = { onError: (e: unknown) => toast.error(e) };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section aria-label="Link công khai" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-2.5">
        <span className="flex items-center gap-2 text-[13px] font-medium"><IconGlobe size={14} className="text-ink-faint" /> Trang phản hồi công khai</span>
        {isManager ? (
          <Switch
            label="Bật trang phản hồi công khai"
            checked={!!settings.data?.enabled}
            disabled={settings.isLoading || sm.enable.isPending || sm.disable.isPending}
            onChange={(v) => (v ? sm.enable : sm.disable).mutate(undefined, fail)}
          />
        ) : (
          <Badge tone={settings.data?.enabled ? "success" : "neutral"}>{settings.data?.enabled ? "Đang bật" : "Đang tắt"}</Badge>
        )}
        {settings.data?.enabled && publicUrl && (
          <>
            <code className="max-w-[320px] truncate rounded bg-hover px-2 py-1 font-mono text-[11.5px] text-ink-2">{publicUrl}</code>
            <Button size="sm" onClick={() => navigator.clipboard.writeText(publicUrl).then(() => toast.success("Đã sao chép link"), () => toast.error("Không sao chép được"))}>
              <IconCopy size={13} /> Sao chép
            </Button>
            {isManager && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={sm.regenerate.isPending}
                  onClick={async () => {
                    if (await confirm({ title: "Tạo lại link?", message: "Link cũ sẽ ngừng hoạt động ngay.", confirmLabel: "Tạo lại link", danger: true })) sm.regenerate.mutate(undefined, fail);
                  }}
                >
                  <IconRefresh size={13} /> Tạo lại link
                </Button>
                <label className="flex items-center gap-2 text-[12.5px] text-ink-2">
                  <Switch label="Hiện timeline module cho khách" checked={!!settings.data.showModuleTimeline} onChange={(v) => sm.showTimeline.mutate(v, fail)} />
                  Hiện timeline module
                </label>
              </>
            )}
          </>
        )}
      </section>

      <div className="flex h-toolbar shrink-0 items-center gap-2 overflow-x-auto border-b border-line bg-surface px-4">
        <SearchInput value={q} onChange={(v) => setQ(v || null)} placeholder="Tìm phản hồi…" label="Tìm phản hồi" className="w-[220px] shrink-0" />
        <Select small aria-label="Lọc trạng thái" className="w-40 shrink-0" value={status} onChange={(e) => setStatus(e.target.value || null)}>
          <option value="">Mọi trạng thái</option>
          {FEEDBACK_STATUSES.map((s) => <option key={s} value={s}>{FEEDBACK_STATUS_LABEL[s]}</option>)}
        </Select>
        <Select small aria-label="Lọc loại" className="w-36 shrink-0" value={type} onChange={(e) => setType(e.target.value || null)}>
          <option value="">Mọi loại</option>
          {FEEDBACK_TYPES.map((t) => <option key={t} value={t}>{FEEDBACK_TYPE_LABEL[t]}</option>)}
        </Select>
        <span className="flex-1" />
        <span className="shrink-0 font-mono text-[12px] text-ink-muted">{list.data?.stats?.totalCount ?? items.length} phản hồi</span>
        <Button size="sm" variant="primary" onClick={() => setCreating(true)}><IconPlus size={13} /> Thêm</Button>
      </div>

      {list.isLoading ? (
        <SkeletonRows rows={8} height={52} />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={<IconChat size={28} />} title="Chưa có phản hồi" description="Bật trang công khai và gửi link cho khách, hoặc thêm phản hồi thủ công." className="flex-1" />
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto bg-surface">
          {items.map((f) => {
            const lvl = priorityLevel(f.priority);
            return (
              <li key={f.id} className="border-b border-line-row">
                <button type="button" onClick={() => setOpen(f.id)} className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left hover:bg-row-hover">
                  <span className="w-[84px] shrink-0 font-mono text-[12px] text-ink-faint">{f.code}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-ink">{f.featureName}</span>
                      <Badge tone={FEEDBACK_TYPE_TONE[f.feedbackType]}>{FEEDBACK_TYPE_LABEL[f.feedbackType]}</Badge>
                      {lvl !== null && <span className="font-mono text-[11px]" style={{ color: PRIORITY_META[lvl].color }}>{PRIORITY_META[lvl].tag}</span>}
                    </span>
                    <span className="block truncate text-[12px] text-ink-muted">{f.submitterName}{f.submitterCompany ? ` · ${f.submitterCompany}` : ""} — {f.content}</span>
                  </span>
                  {(f.tasks ?? []).length > 0 && <span className="shrink-0 font-mono text-[11.5px] text-ink-muted max-sm:hidden">{f.tasks.length} task</span>}
                  <Badge tone={FEEDBACK_STATUS_TONE[f.status]}>{FEEDBACK_STATUS_LABEL[f.status]}</Badge>
                  <span className="w-[68px] shrink-0 text-right font-mono text-[11.5px] text-ink-faint max-sm:hidden">{fmtDate(f.createdAt)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <CreateFeedbackDialog open={creating} projectId={projectId} onClose={() => setCreating(false)} />
      <FeedbackDetailDialog feedback={opened} projectId={projectId} onClose={() => setOpen(null)} />
    </div>
  );
}
