"use client";

import { use, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProjectModules } from "@/lib/api/endpoints";
import type { ModuleResponse } from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import {
  MODULE_STATUS_COLOR,
  MODULE_STATUS_LABEL,
  MODULE_STATUS_ORDER,
  SPRINT_STATUS_COLOR,
  activeSprint,
  isReleaseOverdue,
  isSprintOverdue,
  moduleTimelineBars,
  sprintSummary,
} from "@/lib/domain/module";
import { fmtDate } from "@/lib/domain/format";
import { useModuleMutations } from "@/lib/hooks/modules";
import { useToast } from "@/lib/toast/ToastProvider";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { Button, IconButton } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/form";
import { Menu } from "@/components/ui/Popover";
import { useConfirm } from "@/components/ui/Confirm";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/feedback";
import { Gantt, type GanttRow } from "@/components/project/Gantt";
import { ModuleFormDialog } from "@/components/project/ModuleFormDialog";
import { ModuleDetailDialog, type ModuleDetailTab } from "@/components/project/ModuleDetailDialog";
import { ModuleDocsCell } from "@/components/project/ModuleDocsCell";
import { IconClock, IconEdit, IconLayers, IconMore, IconPaperclip, IconPlus, IconTimeline, IconTrash } from "@/components/icons";

export default function ProjectModulesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { workspaceId } = useWorkspace();
  const toast = useToast();
  const confirm = useConfirm();
  const [view, setView] = useUrlState("view", "table");
  const [form, setForm] = useState<{ module: ModuleResponse | null } | null>(null);
  const [detailOpen, setDetailOpen] = useState<{ id: string; tab: ModuleDetailTab } | null>(null);
  const setDetailId = (id: string | null, tab: ModuleDetailTab = "sprints") => setDetailOpen(id ? { id, tab } : null);
  const { remove, update } = useModuleMutations(projectId);

  const q = useQuery({ queryKey: qk.modules(workspaceId, projectId), queryFn: () => fetchAll((p) => getProjectModules(projectId, p)), enabled: !!workspaceId });
  const modules = useMemo(() => q.data ?? [], [q.data]);
  const detail = modules.find((m) => m.id === detailOpen?.id) ?? null;

  const rows = useMemo<GanttRow[]>(
    () =>
      modules
        .map((m) => ({ id: m.id, title: m.name, onOpen: () => setDetailId(m.id), label: <span className="truncate font-medium">{m.name}</span>, bars: moduleTimelineBars(m, fmtDate) }))
        .filter((r) => r.bars.length > 0),
    [modules],
  );

  return (
    <>
      <div className="flex h-toolbar shrink-0 items-center gap-2 border-b border-line bg-surface px-4">
        <SegmentedControl label="Kiểu xem" size="sm" value={view === "timeline" ? "timeline" : "table"} onChange={(v) => setView(v === "table" ? null : v)} options={[{ value: "table", label: "Bảng" }, { value: "timeline", label: "Timeline" }]} />
        <span className="flex-1" />
        <Button size="sm" variant="primary" onClick={() => setForm({ module: null })}>
          <IconPlus size={13} /> Tạo module
        </Button>
      </div>

      {q.isLoading ? (
        <SkeletonRows rows={6} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : modules.length === 0 ? (
        <EmptyState icon={<IconLayers size={28} />} title="Dự án chưa có module" description="Module gom các task thành từng hạng mục lớn, chia thành các sprint ngắn tới ngày phát hành." action={<Button variant="primary" onClick={() => setForm({ module: null })}>Tạo module đầu tiên</Button>} className="flex-1" />
      ) : view === "timeline" ? (
        <Gantt rows={rows} defaultZoom="month" empty={<EmptyState title="Module chưa có ngày bắt đầu" description="Thêm sprint hoặc đặt ngày bắt đầu để module hiện trên timeline." className="flex-1" />} />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto bg-surface">
          <table className="w-full min-w-[960px] border-collapse text-[13px]">
            <thead className="sticky top-0 z-10 bg-surface-sunken text-left text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              <tr className="h-thead border-b border-line">
                <th className="px-4">Module</th>
                <th className="px-2">Trạng thái</th>
                <th className="px-2">Sprint</th>
                <th className="px-2">Bắt đầu</th>
                <th className="px-2">Phát hành</th>
                <th className="px-2 text-right">Task</th>
                <th className="px-2 text-right">Ước tính</th>
                <th className="px-2">Tài liệu</th>
                <th className="w-12 px-2"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => {
                const overdue = isReleaseOverdue(m);
                const running = activeSprint(m);
                const sprintLate = running ? isSprintOverdue(running) : false;
                return (
                  <tr key={m.id} className="h-row border-b border-line-row hover:bg-row-hover">
                    <td className="px-4">
                      <button type="button" onClick={() => setDetailId(m.id)} className="font-medium text-ink hover:text-accent-ink">{m.name}</button>
                    </td>
                    <td className="px-2">
                      <Menu
                        trigger={({ ref, open: _o, ...p }) => (
                          <button ref={ref} type="button" aria-label={`Đổi trạng thái ${m.name}`} {...p} className="inline-flex h-ctl-sm items-center gap-1.5 rounded-md px-1.5 text-[12px] hover:bg-hover">
                            <span className="size-2 rounded-full" style={{ background: MODULE_STATUS_COLOR[m.status] }} aria-hidden="true" />
                            {MODULE_STATUS_LABEL[m.status]}
                          </button>
                        )}
                        items={MODULE_STATUS_ORDER.map((st) => ({
                          label: MODULE_STATUS_LABEL[st],
                          checked: st === m.status,
                          onSelect: () => {
                            if (st === m.status) return;
                            update.mutate({ id: m.id, body: { status: st } }, { onSuccess: () => toast.success(`${m.name}: ${MODULE_STATUS_LABEL[st]}`), onError: (e) => toast.error(e) });
                          },
                        }))}
                      />
                    </td>
                    <td className="px-2">
                      <button type="button" onClick={() => setDetailId(m.id)} className={`inline-flex h-ctl-sm items-center gap-1.5 rounded-md px-1.5 text-[12px] hover:bg-hover ${sprintLate ? "font-medium text-danger" : running ? "text-ink" : "text-ink-muted"}`}>
                        {running && <span className="size-2 rounded-full" style={{ background: sprintLate ? "var(--danger)" : SPRINT_STATUS_COLOR.active }} aria-hidden="true" />}
                        {sprintSummary(m)}
                      </button>
                    </td>
                    <td className="px-2 font-mono text-[12px] text-ink-muted">{fmtDate(m.startDate)}</td>
                    <td className={`px-2 font-mono text-[12px] ${overdue ? "font-medium text-danger" : "text-ink-muted"}`} title={m.status === "released" && m.releasedAt ? `Đã phát hành ${fmtDate(m.releasedAt)}` : overdue ? "Quá ngày phát hành mục tiêu" : "Ngày phát hành mục tiêu"}>
                      {m.status === "released" && m.releasedAt ? fmtDate(m.releasedAt) : fmtDate(m.endDate)}
                    </td>
                    <td className="px-2 text-right font-mono text-[12px]">{m.taskCount}</td>
                    <td className="px-2 text-right font-mono text-[12px]">{m.totalEstimation ? `${m.totalEstimation}h` : "—"}</td>
                    <td className="px-2"><ModuleDocsCell module={m} onOpen={() => setDetailId(m.id, "files")} /></td>
                    <td className="px-2">
                      <Menu
                        align="end"
                        trigger={({ ref, open: _o, ...p }) => (
                          <IconButton ref={ref} label={`Thao tác ${m.name}`} variant="ghost" size="sm" {...p}>
                            <IconMore size={14} />
                          </IconButton>
                        )}
                        items={[
                          { label: "Sprint", icon: <IconTimeline size={14} />, onSelect: () => setDetailId(m.id) },
                          { label: "Tài liệu", icon: <IconPaperclip size={14} />, onSelect: () => setDetailId(m.id, "files") },
                          { label: "Lịch sử thay đổi", icon: <IconClock size={14} />, onSelect: () => setDetailId(m.id, "history") },
                          { label: "Sửa", icon: <IconEdit size={14} />, onSelect: () => setForm({ module: m }) },
                          {
                            label: "Xoá",
                            icon: <IconTrash size={14} />,
                            danger: true,
                            separated: true,
                            onSelect: async () => {
                              if (await confirm({ title: `Xoá module "${m.name}"?`, message: "Các task trong module sẽ không còn thuộc module nào.", danger: true })) {
                                remove.mutate(m.id, { onSuccess: () => toast.success("Đã xoá module"), onError: (e) => toast.error(e) });
                              }
                            },
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ModuleFormDialog open={!!form} module={form?.module} projectId={projectId} onClose={() => setForm(null)} />
      <ModuleDetailDialog
        key={detailOpen ? `${detailOpen.id}-${detailOpen.tab}` : "closed"}
        module={detail}
        tab={detailOpen?.tab}
        onClose={() => setDetailId(null)}
        onEdit={(m) => {
          setDetailId(null);
          setForm({ module: m });
        }}
      />
    </>
  );
}
