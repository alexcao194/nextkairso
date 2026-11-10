"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TaskResponse } from "@/lib/api/schema";
import { localDateKey, isOverdue } from "@/lib/domain/task";
import { fmtDateTime, fmtRelative } from "@/lib/domain/format";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import {
  endOfDayISO,
  startOfDayISO,
  useCreateLabel,
  useDeleteTask,
  useProjectLabels,
  useProjectMembers,
  useProjectModules,
  useSyncTaskFaultHolders,
  useSyncTaskLabels,
  useSyncTaskWorkers,
  useTask,
  useUpdateTask,
  type TaskPatch,
} from "@/lib/hooks/tasks";
import { useAttachmentMutations, useSubtasks, useTaskAttachments, useTaskFeedbacks, useTaskHistory } from "@/lib/hooks/taskExtras";
import { uploadFile } from "@/lib/upload";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { Button, IconButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/form";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { MarkdownView } from "@/components/ui/MarkdownView";
import { Menu } from "@/components/ui/Popover";
import { Tabs } from "@/components/ui/Tabs";
import { useConfirm } from "@/components/ui/Confirm";
import { StatusChip } from "./StatusChip";
import { PriorityTag } from "./PriorityTag";
import { DateField, LabelPicker, ModulePicker, PeoplePicker, PriorityPicker, StatusPicker } from "./pickers";
import { AttachmentLink, CommentComposer, CommentList } from "./TaskComments";
import { useDialogs } from "@/components/dialogs/DialogProvider";
import {
  IconAlert,
  IconArchive,
  IconChevronDown,
  IconChevronUp,
  IconClose,
  IconCopy,
  IconEdit,
  IconMaximize,
  IconMore,
  IconPaperclip,
  IconPlus,
  IconTrash,
} from "@/components/icons";

const FIELD_LABEL: Record<string, string> = {
  title: "Tiêu đề",
  description: "Mô tả",
  status: "Trạng thái",
  priority: "Ưu tiên",
  module_id: "Module",
  moduleId: "Module",
  estimation: "Ước tính",
  start_date: "Ngày bắt đầu",
  startDate: "Ngày bắt đầu",
  end_date: "Hạn",
  endDate: "Hạn",
  archived: "Lưu trữ",
  parent_id: "Task cha",
  fault_holder_id: "Người chịu lỗi",
  return_count: "Số lần trả lại",
  workers: "Người làm",
  fault_holders: "Người chịu lỗi",
  labels: "Nhãn",
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex min-h-8 items-start gap-3 max-sm:flex-col max-sm:gap-1">
    <span className="w-[108px] shrink-0 pt-1.5 text-[12px] text-ink-muted">{label}</span>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

const dateKey = (iso?: string) => (iso ? localDateKey(new Date(iso)) : "");

export function TaskDetailPanel({
  taskId,
  variant = "panel",
  onClose,
  onPrev,
  onNext,
}: {
  taskId: string;
  variant?: "panel" | "page";
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const task = useTask(taskId);
  if (task.isLoading) return <Shell variant={variant}><PanelSkeleton /></Shell>;
  if (task.isError || !task.data)
    return (
      <Shell variant={variant} onClose={onClose}>
        <ErrorState error={task.error ?? new Error("Không tìm thấy task")} onRetry={() => task.refetch()} />
      </Shell>
    );
  return <Loaded task={task.data} variant={variant} onClose={onClose} onPrev={onPrev} onNext={onNext} />;
}

function Shell({ variant, children, onClose }: { variant: "panel" | "page"; children: React.ReactNode; onClose?: () => void }) {
  return (
    <aside
      aria-label="Chi tiết task"
      className={
        variant === "panel"
          ? "flex h-full w-panel shrink-0 flex-col border-l border-line bg-surface max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-40 max-lg:w-full max-lg:max-w-[480px] max-lg:shadow-overlay max-sm:max-w-none"
          : "mx-auto flex h-full w-full max-w-[760px] flex-col bg-surface"
      }
    >
      {onClose && (
        <div className="flex justify-end p-2">
          <IconButton label="Đóng" variant="ghost" size="sm" onClick={onClose}>
            <IconClose size={14} />
          </IconButton>
        </div>
      )}
      {children}
    </aside>
  );
}

const PanelSkeleton = () => (
  <div className="flex flex-col gap-4 p-5" role="status" aria-label="Đang tải">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-7 w-4/5" />
    <Skeleton className="h-8 w-full" />
    {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-6 w-full" />)}
  </div>
);

function Loaded({
  task,
  variant,
  onClose,
  onPrev,
  onNext,
}: {
  task: TaskResponse;
  variant: "panel" | "page";
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const { workspaceId, isManager, projectById } = useWorkspace();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { openCreateTask } = useDialogs();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const syncLabels = useSyncTaskLabels();
  const syncWorkers = useSyncTaskWorkers();
  const syncFault = useSyncTaskFaultHolders();

  const members = useProjectMembers(workspaceId, task.projectId);
  const labels = useProjectLabels(workspaceId, task.projectId);
  const modules = useProjectModules(workspaceId, task.projectId);
  const createLabel = useCreateLabel(workspaceId, task.projectId);
  const project = projectById(task.projectId);

  const [tab, setTab] = useState<"comments" | "subtasks" | "history">("comments");
  const [title, setTitle] = useState(task.title);
  useEffect(() => setTitle(task.title), [task.title, task.id]);

  const people = useMemo(
    () => (members.data ?? []).map((m) => ({ id: m.userId, name: m.userName, avatar: m.userAvatar, alias: m.userAlias })),
    [members.data],
  );
  const asMap = (l: Array<{ user: { id: string }; weight: number }> | undefined) => Object.fromEntries((l ?? []).map((x) => [x.user.id, x.weight]));

  const patch = (p: TaskPatch) => update.mutate({ id: task.id, patch: p }, { onError: (e) => toast.error(e) });
  const fail = { onError: (e: unknown) => toast.error(e) };

  const link = typeof window === "undefined" ? "" : `${window.location.origin}/projects/${task.projectId}/tasks?task=${task.id}`;
  const overdue = isOverdue(task);

  return (
    <Shell variant={variant}>
      <header className="flex h-topbar shrink-0 items-center gap-1 border-b border-line px-3">
        <span className="font-mono text-[12px] text-ink-faint">{task.code}</span>
        {project && <span className="truncate text-[12px] text-ink-faint">· {project.name}</span>}
        <span className="flex-1" />
        {onPrev && (
          <IconButton label="Task trước" variant="ghost" size="sm" onClick={onPrev}>
            <IconChevronUp size={14} />
          </IconButton>
        )}
        {onNext && (
          <IconButton label="Task sau" variant="ghost" size="sm" onClick={onNext}>
            <IconChevronDown size={14} />
          </IconButton>
        )}
        <IconButton
          label="Sao chép liên kết"
          variant="ghost"
          size="sm"
          onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Đã sao chép liên kết"), () => toast.error("Không sao chép được"))}
        >
          <IconCopy size={14} />
        </IconButton>
        {variant === "panel" && (
          <IconButton label="Mở trang đầy đủ" variant="ghost" size="sm" onClick={() => router.push(`/projects/${task.projectId}/tasks/${task.id}`)}>
            <IconMaximize size={14} />
          </IconButton>
        )}
        <Menu
          align="end"
          trigger={({ ref, open: _o, ...p }) => (
            <IconButton ref={ref} label="Thêm thao tác" variant="ghost" size="sm" {...p}>
              <IconMore size={14} />
            </IconButton>
          )}
          items={[
            { label: "Tạo task con", icon: <IconPlus size={14} />, onSelect: () => openCreateTask({ projectId: task.projectId, parentId: task.id, moduleId: task.moduleId }) },
            { label: task.archived ? "Bỏ lưu trữ" : "Lưu trữ", icon: <IconArchive size={14} />, onSelect: () => patch({ archived: !task.archived }) },
            ...(isManager
              ? [{
                  label: "Xoá task",
                  icon: <IconTrash size={14} />,
                  danger: true,
                  separated: true,
                  onSelect: async () => {
                    if (!(await confirm({ title: `Xoá ${task.code}?`, message: "Task và toàn bộ bình luận sẽ bị xoá vĩnh viễn.", danger: true }))) return;
                    del.mutate(task.id, { onSuccess: () => { toast.success("Đã xoá task"); onClose ? onClose() : router.replace(`/projects/${task.projectId}/tasks`); }, ...fail });
                  },
                }]
              : []),
          ]}
        />
        {onClose && (
          <IconButton label="Đóng" variant="ghost" size="sm" onClick={onClose}>
            <IconClose size={14} />
          </IconButton>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-5">
          {task.archived && <Badge tone="warning">Đã lưu trữ</Badge>}
          <div>
            <label htmlFor="task-title" className="sr-only">
              Tiêu đề task
            </label>
            <textarea
              id="task-title"
              value={title}
              rows={1}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                const t = title.trim();
                if (!t) setTitle(task.title);
                else if (t !== task.title) patch({ title: t });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.preventDefault(), e.currentTarget.blur());
                if (e.key === "Escape") (setTitle(task.title), e.currentTarget.blur());
              }}
              className="w-full resize-none rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[18px] font-semibold leading-snug text-ink outline-none hover:border-line focus:border-accent"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPicker value={task.status} onChange={(status) => patch({ status })} />
            <PriorityPicker value={task.priority} onChange={(priority) => patch({ priority })} />
            <PeoplePicker
              title="Người làm"
              emptyLabel="Chưa giao"
              people={people}
              value={asMap(task.workers)}
              onChange={(v) => syncWorkers.mutate({ task, people: v }, fail)}
            />
            {overdue && (
              <Badge tone="danger">
                <IconAlert size={11} /> Quá hạn
              </Badge>
            )}
            {task.returnCount > 0 && <Badge tone="warning">Trả lại ×{task.returnCount}</Badge>}
          </div>

          <div className="flex flex-col gap-1">
            <Row label="Module">
              <ModulePicker bare modules={modules.data ?? []} value={task.moduleId} onChange={(id) => patch({ moduleId: id })} />
            </Row>
            <Row label="Nhãn">
              <LabelPicker
                bare
                labels={labels.data ?? []}
                value={(task.labels ?? []).map((l) => l.id)}
                onChange={(ids) => syncLabels.mutate({ task, labelIds: ids }, fail)}
                onCreate={async (name, color) => {
                  try {
                    return await createLabel.mutateAsync({ name, color });
                  } catch (e) {
                    toast.error(e);
                  }
                }}
              />
            </Row>
            <Row label="Người chịu lỗi">
              <PeoplePicker
                bare
                title="Người chịu lỗi"
                emptyLabel="Chưa chỉ định"
                people={people}
                value={asMap(task.faultHolders)}
                onChange={(v) => syncFault.mutate({ task, people: v }, fail)}
              />
            </Row>
            <Row label="Bắt đầu">
              <DateField label="Ngày bắt đầu" value={dateKey(task.startDate)} onChange={(v) => patch({ startDate: v ? startOfDayISO(v) : null })} />
            </Row>
            <Row label="Hạn">
              <DateField label="Hạn hoàn thành" value={dateKey(task.endDate)} min={dateKey(task.startDate) || undefined} onChange={(v) => patch({ endDate: v ? endOfDayISO(v) : null })} />
            </Row>
            <Row label="Ước tính (giờ)">
              <EstimateField value={task.estimation} onCommit={(n) => patch({ estimation: n })} />
            </Row>
          </div>

          <Description task={task} onSave={(d) => patch({ description: d })} />
          <Attachments taskId={task.id} />
          <LinkedFeedback task={task} />
        </div>

        <Tabs
          label="Chi tiết task"
          value={tab}
          onChange={setTab}
          className="sticky top-0 z-10 bg-surface px-3"
          tabs={[
            { value: "comments", label: "Bình luận" },
            { value: "subtasks", label: "Task con" },
            { value: "history", label: "Lịch sử" },
          ]}
        />
        {tab === "comments" && <CommentList taskId={task.id} />}
        {tab === "subtasks" && <Subtasks task={task} />}
        {tab === "history" && <History taskId={task.id} />}
      </div>
      {tab === "comments" && <CommentComposer taskId={task.id} />}
    </Shell>
  );
}

function EstimateField({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [v, setV] = useState(String(value || ""));
  useEffect(() => setV(String(value || "")), [value]);
  return (
    <Input
      small
      type="number"
      min={0}
      aria-label="Ước tính (giờ)"
      className="w-24 font-mono"
      value={v}
      placeholder="0"
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const n = Math.max(0, Math.round(Number(v) || 0));
        if (n !== value) onCommit(n);
      }}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );
}

function Description({ task, onSave }: { task: TaskResponse; onSave: (d: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(task.description ?? "");
  useEffect(() => setText(task.description ?? ""), [task.description, task.id]);
  const save = () => (onSave(text.trim()), setEditing(false));

  if (editing)
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[12px] font-medium text-ink-2">Mô tả</p>
        <MarkdownEditor
          autoFocus
          label="Mô tả task"
          height={260}
          value={text}
          onChange={setText}
          onSubmit={save}
          placeholder="Hỗ trợ Markdown: **đậm**, danh sách, `code`, liên kết… Dán ảnh để chèn."
          onUploadImage={async (f) => (await uploadFile(f, "task_file", task.id)).fileUrl}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={save}>Lưu</Button>
          <Button size="sm" onClick={() => (setText(task.description ?? ""), setEditing(false))}>Huỷ</Button>
          <span className="ml-auto text-[11px] text-ink-faint max-sm:hidden">Ctrl/⌘ + Enter để lưu</span>
        </div>
      </div>
    );
  return (
    <div>
      <div className="mb-1 flex items-center">
        <p className="text-[12px] font-medium text-ink-2">Mô tả</p>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setEditing(true)}>
          <IconEdit size={12} /> {task.description ? "Sửa" : "Thêm mô tả"}
        </Button>
      </div>
      <MarkdownView source={task.description} placeholder="Chưa có mô tả." />
    </div>
  );
}

function Attachments({ taskId }: { taskId: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const list = useTaskAttachments(taskId);
  const { add, remove } = useAttachmentMutations(taskId);
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of files) {
        const up = await uploadFile(f, "task_file", taskId);
        await add.mutateAsync({ fileName: up.fileName, fileUrl: up.fileUrl, contentType: up.contentType, sizeBytes: up.sizeBytes });
      }
    } catch (e) {
      toast.error(e);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <p className="text-[12px] font-medium text-ink-2">Đính kèm{list.data?.length ? ` (${list.data.length})` : ""}</p>
        <input ref={ref} type="file" multiple className="sr-only" aria-label="Chọn file đính kèm" onChange={(e) => onFiles(e.target.files)} />
        <Button size="sm" variant="ghost" loading={busy} onClick={() => ref.current?.click()}>
          <IconPaperclip size={13} /> Thêm file
        </Button>
      </div>
      {list.data && list.data.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {list.data.map((a) => (
            <li key={a.id} className="group flex items-center gap-1">
              <AttachmentLink url={a.fileUrl} name={a.fileName} type={a.contentType} size={a.sizeBytes} />
              <button
                type="button"
                aria-label={`Xoá ${a.fileName}`}
                onClick={async () => {
                  if (await confirm({ title: "Xoá đính kèm?", message: a.fileName, danger: true })) remove.mutate(a.id, { onError: (e) => toast.error(e) });
                }}
                className="text-ink-faint opacity-0 hover:text-danger focus:opacity-100 group-hover:opacity-100"
              >
                <IconClose size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LinkedFeedback({ task }: { task: TaskResponse }) {
  const [open, setOpen] = useState(false);
  const q = useTaskFeedbacks(task.id, open);
  if (!task.linkedFeedbackCount) return null;
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-[12.5px] font-medium text-accent-ink">
        {open ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
        {task.linkedFeedbackCount} feedback khách hàng liên quan
      </button>
      {open && (
        <ul className="mt-2 flex flex-col gap-2">
          {(q.data ?? []).map((f) => (
            <li key={f.id} className="rounded-md border border-line p-2.5 text-[12.5px]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-ink-faint">{f.code}</span>
                <span className="font-medium">{f.featureName}</span>
                <Badge className="ml-auto">{f.submitterName}</Badge>
              </div>
              <p className="mt-1 line-clamp-3 text-ink-2">{f.content}</p>
            </li>
          ))}
          {q.isLoading && <Skeleton className="h-14" />}
        </ul>
      )}
    </div>
  );
}

function Subtasks({ task }: { task: TaskResponse }) {
  const { workspaceId } = useWorkspace();
  const { openCreateTask } = useDialogs();
  const q = useSubtasks(workspaceId, task.projectId, task.id);
  return (
    <div className="p-4">
      {q.isLoading && <Skeleton className="h-9" />}
      {q.data?.length === 0 && <EmptyState title="Chưa có task con" className="py-6" />}
      <ul className="flex flex-col">
        {(q.data ?? []).map((s) => (
          <li key={s.id}>
            <Link href={`/projects/${s.projectId}/tasks?task=${s.id}`} className="flex h-9 items-center gap-2 rounded-md px-2 hover:bg-hover">
              <span className="font-mono text-[12px] text-ink-faint">{s.code}</span>
              <span className="min-w-0 flex-1 truncate text-[13px]">{s.title}</span>
              <PriorityTag priority={s.priority} showLabel={false} />
              <StatusChip status={s.status} size="sm" />
            </Link>
          </li>
        ))}
      </ul>
      <Button size="sm" className="mt-2" onClick={() => openCreateTask({ projectId: task.projectId, parentId: task.id, moduleId: task.moduleId })}>
        <IconPlus size={13} /> Thêm task con
      </Button>
    </div>
  );
}

function History({ taskId }: { taskId: string }) {
  const { memberById } = useWorkspace();
  const q = useTaskHistory(taskId);
  if (q.isLoading) return <div className="p-4"><Skeleton className="h-24" /></div>;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data?.length) return <EmptyState title="Chưa có lịch sử thay đổi" className="py-8" />;

  const show = (field: string, v?: string) => {
    if (!v) return "—";
    if (field === "workers" || field === "fault_holders") return memberById(v)?.userName ?? "Một thành viên";
    if (field === "status") return (v === "in_progress" ? "Đang làm" : v);
    if (/date/i.test(field)) return fmtDateTime(v);
    return v.length > 60 ? `${v.slice(0, 60)}…` : v;
  };

  return (
    <ul className="flex flex-col gap-3 p-4">
      {q.data.map((h) => (
        <li key={h.id} className="flex gap-2.5 text-[12.5px]">
          <Avatar person={{ id: h.changedBy.id, name: h.changedBy.name, avatar: h.changedBy.avatar }} />
          <div className="min-w-0 flex-1">
            <p className="text-ink-2">
              <span className="font-medium text-ink">{h.changedBy.name}</span> đã đổi{" "}
              <span className="font-medium">{FIELD_LABEL[h.field] ?? h.field}</span>
              {h.field === "workers" || h.field === "fault_holders" ? (
                <> — {h.newValue ? "thêm" : "bỏ"} <span className="font-medium">{show(h.field, h.newValue ?? h.oldValue)}</span></>
              ) : h.field === "description" ? null : (
                <> từ <span className="text-ink-muted">{show(h.field, h.oldValue)}</span> sang <span className="font-medium">{show(h.field, h.newValue)}</span></>
              )}
            </p>
            <p className="text-[11.5px] text-ink-faint">{fmtRelative(h.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
