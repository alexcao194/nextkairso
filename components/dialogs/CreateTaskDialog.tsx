"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getMeeting, patchMeeting } from "@/lib/api/endpoints";
import type { MeetingItem, MeetingMinutesResponse, ModuleResponse, ProjectFeedbackResponse, TaskResponse, TaskStatus } from "@/lib/api/schema";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import {
  endOfDayISO,
  startOfDayISO,
  useCreateLabel,
  useCreateTask,
  useProjectLabels,
  useProjectMembers,
  useProjectModules,
} from "@/lib/hooks/tasks";
import { useFeedbackMutations, useProjectFeedbacks } from "@/lib/hooks/feedback";
import { useMeeting } from "@/lib/hooks/meetings";
import { fmtDate } from "@/lib/domain/format";
import { priorityToApi } from "@/lib/domain/task";
import { uploadFile } from "@/lib/upload";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { DateField, LabelPicker, ModulePicker, PeoplePicker, PriorityPicker, StatusPicker } from "@/components/kairso/pickers";

export interface CreateTaskDefaults {
  projectId?: string;
  status?: TaskStatus;
  moduleId?: string;
  parentId?: string;
  feedbackId?: string;
  meetingId?: string;
  meetingItemId?: string;
}

interface Seed {
  title: string;
  description: string;
  priority?: number;
  end?: string;
  moduleId?: string;
}

function feedbackSeed(f: ProjectFeedbackResponse): Seed {
  const who = [f.submitterName, f.submitterCompany].filter(Boolean).join(" · ");
  const images = (f.images ?? []).map((src) => `![Ảnh đính kèm](${src})`).join("\n");
  return {
    title: f.featureName.slice(0, 200),
    description: [`> Từ phản hồi **${f.code}**${who ? ` của ${who}` : ""}`, f.content, images].filter(Boolean).join("\n\n"),
    priority: f.priority || undefined,
    end: f.expectedFixDate ? f.expectedFixDate.slice(0, 10) : undefined,
  };
}

export function CreateTaskDialog({ defaults, onClose }: { defaults: CreateTaskDefaults | null; onClose: () => void }) {
  return (
    <Modal open={!!defaults} onClose={onClose} title={defaults?.parentId ? "Tạo task con" : defaults?.feedbackId ? "Tạo task từ phản hồi" : defaults?.meetingId ? "Tạo task từ biên bản họp" : "Tạo task"} width={1040}>
      {defaults &&
        (defaults.feedbackId && defaults.projectId ? (
          <FromFeedback defaults={defaults} onClose={onClose} />
        ) : defaults.meetingId && defaults.meetingItemId ? (
          <FromMeeting defaults={defaults} onClose={onClose} />
        ) : (
          <Form defaults={defaults} onClose={onClose} />
        ))}
    </Modal>
  );
}

function meetingSeed(m: MeetingMinutesResponse, it: MeetingItem, modules: ModuleResponse[]): Seed {
  const mod = it.module.trim().toLowerCase();
  return {
    title: it.content.split("\n")[0].slice(0, 200),
    description: [
      `> Từ biên bản họp **${m.title}** (${fmtDate(m.meetingDate)})`,
      it.module ? `**Phân hệ:** ${it.module}` : "",
      it.content,
      it.note ? `**Ghi chú:** ${it.note}` : "",
    ].filter(Boolean).join("\n\n"),
    priority: it.priority ? priorityToApi(1) : undefined,
    moduleId: mod ? modules.find((x) => x.name.trim().toLowerCase() === mod)?.id : undefined,
  };
}

function FromMeeting({ defaults, onClose }: { defaults: CreateTaskDefaults; onClose: () => void }) {
  const { workspaceId } = useWorkspace();
  const meeting = useMeeting(defaults.meetingId);
  const modules = useProjectModules(workspaceId, defaults.projectId ?? "");
  if (meeting.isLoading || (defaults.projectId && modules.isLoading)) return <p className="py-6 text-center text-[13px] text-ink-muted">Đang tải biên bản…</p>;
  const it = meeting.data?.items.find((i) => i.id === defaults.meetingItemId);
  return <Form defaults={defaults} seed={meeting.data && it ? meetingSeed(meeting.data, it, modules.data ?? []) : undefined} onClose={onClose} />;
}

async function linkMeetingItem(meetingId: string, itemId: string, task: TaskResponse) {
  const m = await getMeeting(meetingId);
  const items = m.items.map((i) => (i.id === itemId ? { ...i, tasks: [...(i.tasks ?? []), { id: task.id, code: task.code }] } : i));
  return patchMeeting(meetingId, { items });
}

function FromFeedback({ defaults, onClose }: { defaults: CreateTaskDefaults; onClose: () => void }) {
  const { workspaceId } = useWorkspace();
  const list = useProjectFeedbacks(workspaceId, defaults.projectId!, {});
  if (list.isLoading) return <p className="py-6 text-center text-[13px] text-ink-muted">Đang tải phản hồi…</p>;
  const fb = (list.data?.items ?? []).find((f) => f.id === defaults.feedbackId);
  return <Form defaults={defaults} seed={fb ? feedbackSeed(fb) : undefined} onClose={onClose} />;
}

function Form({ defaults, seed, onClose }: { defaults: CreateTaskDefaults; seed?: Seed; onClose: () => void }) {
  const { workspaceId, projects } = useWorkspace();
  const router = useRouter();
  const toast = useToast();

  const [projectId, setProjectId] = useState(defaults.projectId ?? projects[0]?.id ?? "");
  const [title, setTitle] = useState(seed?.title ?? "");
  const [description, setDescription] = useState(seed?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(defaults.status ?? "todo");
  const [priority, setPriority] = useState(seed?.priority ?? priorityToApi(2));
  const [moduleId, setModuleId] = useState<string | null>(seed?.moduleId ?? defaults.moduleId ?? null);
  const [estimation, setEstimation] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState(seed?.end ?? "");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [workers, setWorkers] = useState<Record<string, number>>({});
  const [faultHolders, setFaultHolders] = useState<Record<string, number>>({});

  const members = useProjectMembers(workspaceId, projectId);
  const labels = useProjectLabels(workspaceId, projectId);
  const modules = useProjectModules(workspaceId, projectId);
  const createLabel = useCreateLabel(workspaceId, projectId);
  const create = useCreateTask(workspaceId, projectId);
  const { link } = useFeedbackMutations(workspaceId, projectId);
  const qc = useQueryClient();

  const people = (members.data ?? []).map((m) => ({ id: m.userId, name: m.userName, avatar: m.userAvatar, alias: m.userAlias }));
  const dateError = start && end && end < start ? "Hạn phải sau ngày bắt đầu" : null;
  const canSubmit = !!projectId && title.trim().length > 0 && !dateError;

  const submit = () => {
    if (!canSubmit) return;
    create.mutate(
      {
        body: {
          title,
          description: description.trim() || undefined,
          status,
          priority,
          moduleId: moduleId ?? undefined,
          parentId: defaults.parentId,
          estimation: estimation ? Math.max(0, Math.round(Number(estimation))) : 0,
          startDate: start ? startOfDayISO(start) : undefined,
          endDate: end ? endOfDayISO(end) : undefined,
        },
        labelIds,
        workers,
        faultHolders,
      },
      {
        onSuccess: async (task) => {
          if (defaults.feedbackId) {
            try {
              await link.mutateAsync({ id: defaults.feedbackId, taskId: task.id });
              toast.success(`Đã tạo ${task.code} và liên kết với phản hồi`);
            } catch (e) {
              toast.error(e);
            }
            onClose();
            return;
          }
          if (defaults.meetingId && defaults.meetingItemId) {
            try {
              await linkMeetingItem(defaults.meetingId, defaults.meetingItemId, task);
              qc.invalidateQueries({ queryKey: ["meetings"] });
              toast.success(`Đã tạo ${task.code} và gắn vào biên bản`);
            } catch (e) {
              toast.error(e);
            }
            onClose();
            return;
          }
          toast.success(`Đã tạo ${task.code}`);
          onClose();
          router.push(`/projects/${projectId}/tasks?task=${task.id}`);
        },
        onError: (e) => toast.error(e),
      },
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
      }}
      className="flex flex-col gap-4"
    >
      {!defaults.projectId && (
        <Field label="Dự án" required>
          {(p) => (
            <Select {...p} value={projectId} onChange={(e) => { setProjectId(e.target.value); setModuleId(null); setLabelIds([]); setWorkers({}); setFaultHolders({}); }}>
              {projects.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      <Field label="Tiêu đề" required>
        {(p) => <Input {...p} autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Việc cần làm…" maxLength={200} />}
      </Field>
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-ink-2">Mô tả</span>
        <MarkdownEditor
          label="Mô tả task"
          height={380}
          value={description}
          onChange={setDescription}
          onSubmit={submit}
          placeholder="Chi tiết, tiêu chí hoàn thành… (hỗ trợ Markdown, dán ảnh để chèn)"
          onUploadImage={projectId ? async (f) => (await uploadFile(f, "project_file", projectId)).fileUrl : undefined}
        />
      </div>

      <div className="grid grid-cols-[108px_1fr] items-center gap-x-3 gap-y-2.5 max-sm:grid-cols-1">
        <span className="text-[12px] text-ink-muted">Trạng thái</span>
        <div><StatusPicker value={status} onChange={setStatus} /></div>
        <span className="text-[12px] text-ink-muted">Ưu tiên</span>
        <div><PriorityPicker value={priority} onChange={setPriority} /></div>
        <span className="text-[12px] text-ink-muted">Module</span>
        <div><ModulePicker modules={modules.data ?? []} value={moduleId ?? undefined} onChange={setModuleId} /></div>
        <span className="text-[12px] text-ink-muted">Người làm</span>
        <div><PeoplePicker title="Người làm" emptyLabel="Chưa giao" people={people} value={workers} onChange={setWorkers} /></div>
        <span className="text-[12px] text-ink-muted">Người chịu lỗi</span>
        <div><PeoplePicker title="Người chịu lỗi" emptyLabel="Chưa chỉ định" people={people} value={faultHolders} onChange={setFaultHolders} /></div>
        <span className="text-[12px] text-ink-muted">Nhãn</span>
        <div>
          <LabelPicker
            labels={labels.data ?? []}
            value={labelIds}
            onChange={setLabelIds}
            onCreate={async (name, color) => {
              try {
                return await createLabel.mutateAsync({ name, color });
              } catch (e) {
                toast.error(e);
              }
            }}
          />
        </div>
        <span className="text-[12px] text-ink-muted">Bắt đầu / Hạn</span>
        <div className="flex flex-wrap items-center gap-2">
          <DateField label="Ngày bắt đầu" value={start} onChange={setStart} />
          <span className="text-ink-faint">→</span>
          <DateField label="Hạn hoàn thành" value={end} onChange={setEnd} min={start || undefined} />
          {dateError && <span className="text-[12px] text-danger">{dateError}</span>}
        </div>
        <label htmlFor="ct-est" className="text-[12px] text-ink-muted">Ước tính (giờ)</label>
        <div><Input id="ct-est" small type="number" min={0} inputMode="numeric" className="w-24 font-mono" value={estimation} onChange={(e) => setEstimation(e.target.value)} placeholder="0" /></div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
        <span className="mr-auto text-[11px] text-ink-faint max-sm:hidden">Ctrl/⌘ + Enter để tạo</span>
        <Button onClick={onClose}>Huỷ</Button>
        <Button type="submit" variant="primary" loading={create.isPending} disabled={!canSubmit}>
          Tạo task
        </Button>
      </div>
    </form>
  );
}
