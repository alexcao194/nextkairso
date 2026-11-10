"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { getWorkspaceProjectTasks } from "@/lib/api/endpoints";
import type { TaskResponse } from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { useMyTasks } from "@/lib/hooks/workspaceData";
import { TASK_STATUSES, STATUS_META, isOverdue, isClosedStatus, localDateKey } from "@/lib/domain/task";
import { DEFAULT_COLUMNS, type ColumnKey, type TaskGroup } from "@/lib/domain/taskView";
import { addDays, projectColor } from "@/lib/domain/format";
import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Checkbox, SearchInput, SegmentedControl, Select } from "@/components/ui/form";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/feedback";
import { TaskTable } from "@/components/project/TaskTable";
import { TaskCards } from "@/components/project/TaskCards";
import { Gantt, type GanttRow } from "@/components/project/Gantt";
import { TaskDetailPanel } from "@/components/kairso/TaskDetailPanel";
import { useDialogs } from "@/components/dialogs/DialogProvider";
import { IconCheckSquare, IconPlus } from "@/components/icons";
import { useRouter } from "next/navigation";

type Tab = "assigned" | "review" | "created" | "done";

const COLUMNS: ColumnKey[] = [...DEFAULT_COLUMNS.filter((c) => c !== "module" && c !== "workers"), "project"];

function bucketize(tasks: TaskResponse[]): TaskGroup[] {
  const today = localDateKey();
  const weekEnd = localDateKey(addDays(new Date(), 7));
  const buckets: TaskGroup[] = [
    { key: "overdue", label: "Quá hạn", dot: "var(--danger)", tasks: [] },
    { key: "today", label: "Hôm nay", dot: "var(--accent)", tasks: [] },
    { key: "week", label: "7 ngày tới", tasks: [] },
    { key: "later", label: "Sau đó", tasks: [] },
    { key: "none", label: "Không có hạn", tasks: [] },
  ];
  for (const t of tasks) {
    const k = !t.endDate ? "none" : isClosedStatus(t.status) ? "later" : isOverdue(t) ? "overdue" : localDateKey(new Date(t.endDate)) === today ? "today" : localDateKey(new Date(t.endDate)) <= weekEnd ? "week" : "later";
    buckets.find((b) => b.key === k)!.tasks.push(t);
  }
  buckets.forEach((b) => b.tasks.sort((a, c) => (a.endDate ?? "9").localeCompare(c.endDate ?? "9")));
  return buckets.filter((b) => b.tasks.length > 0);
}

export default function MyTasksPage() {
  const { user } = useAuth();
  const { workspaceId, projects } = useWorkspace();
  const { openCreateTask } = useDialogs();
  const router = useRouter();
  const [tab, setTab] = useUrlState("tab", "assigned");
  const [group, setGroup] = useUrlState("group", "due");
  const [view, setView] = useUrlState("view", "table");
  const [project, setProject] = useUrlState("project", "");
  const [taskId, setTaskId] = useUrlState("task", "");
  const [q, setQ] = useState("");
  const [hideDone, setHideDone] = useState(true);

  const assigned = useMyTasks(workspaceId);
  const created = useQueries({
    queries: projects.map((p) => ({
      queryKey: qk.tasks(workspaceId, p.id, { createdById: user?.id, archived: false }),
      enabled: tab === "created" && !!user,
      queryFn: () => fetchAll(async (pg) => {
        const r = await getWorkspaceProjectTasks(workspaceId, p.id, { createdById: user!.id, archived: false, ...pg });
        return { items: r.items ?? [], page: r.page ?? pg.page, limit: r.limit ?? pg.limit, hasMore: !!r.hasMore };
      }, 200, 3),
    })),
  });

  const loading = tab === "created" ? created.some((c) => c.isLoading) : assigned.isLoading;
  const error = tab === "created" ? created.find((c) => c.isError)?.error : assigned.error;

  const source = useMemo<TaskResponse[]>(
    () => (tab === "created" ? created.flatMap((c) => c.data ?? []) : (assigned.data ?? [])).filter((t) => !t.archived),
    [tab, created, assigned.data],
  );

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return source.filter((t) => {
      if (tab === "assigned" && isClosedStatus(t.status)) return false;
      if (tab === "review" && t.status !== "review") return false;
      if (tab === "done" && t.status !== "done") return false;
      if (tab === "created" && hideDone && isClosedStatus(t.status)) return false;
      if (project && t.projectId !== project) return false;
      return !needle || `${t.title} ${t.code}`.toLowerCase().includes(needle);
    });
  }, [source, tab, q, project, hideDone]);

  const groups = useMemo<TaskGroup[]>(() => {
    if (group === "none") return [{ key: "all", label: "Tất cả", tasks: list }];
    if (group === "project")
      return projects.map((p) => ({ key: p.id, label: p.name, dot: projectColor(p.id), tasks: list.filter((t) => t.projectId === p.id) })).filter((g) => g.tasks.length);
    if (group === "status") return TASK_STATUSES.map((s) => ({ key: s, label: STATUS_META[s].label, dot: STATUS_META[s].dot, tasks: list.filter((t) => t.status === s) })).filter((g) => g.tasks.length);
    return bucketize(list);
  }, [list, group, projects]);

  const counts = useMemo(() => {
    const a = assigned.data?.filter((t) => !t.archived) ?? [];
    return { assigned: a.filter((t) => !isClosedStatus(t.status)).length, review: a.filter((t) => t.status === "review").length };
  }, [assigned.data]);

  const rows = useMemo<GanttRow[]>(
    () =>
      list.filter((t) => t.startDate || t.endDate).map((t) => {
        const s = new Date(t.startDate ?? t.endDate!);
        const e = new Date(t.endDate ?? t.startDate!);
        return {
          id: t.id,
          title: `${t.code} · ${t.title}`,
          onOpen: () => setTaskId(t.id),
          label: <span className="flex min-w-0 items-center gap-2"><span className="font-mono text-[11px] text-ink-faint">{t.code}</span><span className="truncate">{t.title}</span></span>,
          bars: [{ start: s, end: e < s ? s : e, color: STATUS_META[t.status].chart, label: t.title }],
        };
      }),
    [list, setTaskId],
  );

  return (
    <>
      <TopBar>
        <Breadcrumb items={[{ label: "Task của tôi" }]} />
        <TopBarSpacer />
        <Button variant="primary" onClick={() => openCreateTask()} className="max-sm:hidden"><IconPlus size={14} /> Tạo task</Button>
      </TopBar>
      <Tabs
        label="Nhóm task"
        value={tab as Tab}
        onChange={(v) => setTab(v === "assigned" ? null : v)}
        className="bg-surface px-3"
        tabs={[
          { value: "assigned", label: "Được giao", count: counts.assigned },
          { value: "review", label: "Chờ duyệt", count: counts.review },
          { value: "created", label: "Tôi tạo" },
          { value: "done", label: "Hoàn thành" },
        ]}
      />
      <div className="flex h-toolbar shrink-0 items-center gap-2 overflow-x-auto border-b border-line bg-surface px-4">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm task…" label="Tìm task" className="w-[220px] shrink-0 max-sm:w-[150px]" />
        <Select small aria-label="Lọc dự án" className="w-44 shrink-0" value={project} onChange={(e) => setProject(e.target.value || null)}>
          <option value="">Mọi dự án</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select small aria-label="Nhóm theo" className="w-36 shrink-0" value={group} onChange={(e) => setGroup(e.target.value === "due" ? null : e.target.value)}>
          <option value="due">Nhóm: Hạn</option>
          <option value="project">Nhóm: Dự án</option>
          <option value="status">Nhóm: Trạng thái</option>
          <option value="none">Không nhóm</option>
        </Select>
        {tab === "created" && <Checkbox label="Ẩn đã xong" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="shrink-0" />}
        <span className="flex-1" />
        <span className="hidden sm:block"><SegmentedControl label="Kiểu xem" size="sm" value={view === "timeline" ? "timeline" : "table"} onChange={(v) => setView(v === "table" ? null : v)} options={[{ value: "table", label: "Bảng" }, { value: "timeline", label: "Timeline" }]} /></span>
        <span className="shrink-0 font-mono text-[12px] text-ink-muted">{list.length} task</span>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {loading ? (
            <SkeletonRows rows={8} />
          ) : error ? (
            <ErrorState error={error} onRetry={() => (tab === "created" ? created.forEach((c) => c.refetch()) : assigned.refetch())} />
          ) : list.length === 0 ? (
            <EmptyState icon={<IconCheckSquare size={28} />} title="Không có task nào" description={tab === "assigned" ? "Bạn chưa được giao task nào đang mở." : "Không có task khớp bộ lọc."} className="flex-1" />
          ) : view === "timeline" ? (
            <Gantt rows={rows} empty={<EmptyState title="Không task nào có ngày" className="flex-1" />} />
          ) : (
            <>
              <div className="hidden min-h-0 flex-1 flex-col sm:flex">
                <TaskTable groups={groups} columns={COLUMNS} modules={[]} selectedId={taskId || null} onOpen={(t) => setTaskId(t.id)} />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto sm:hidden">
                <TaskCards groups={groups} onOpen={(t) => router.push(`/projects/${t.projectId}/tasks/${t.id}`)} />
              </div>
            </>
          )}
        </div>
        {taskId && <TaskDetailPanel taskId={taskId} onClose={() => setTaskId(null)} />}
      </div>
    </>
  );
}
