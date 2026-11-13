"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getMeeting, patchMeeting, postTaskAttachments } from "@/lib/api/endpoints";
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
import { fmtBytes, uploadFile } from "@/lib/upload";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { DateField, LabelPicker, ModulePicker, PeoplePicker, PriorityPicker, StatusPicker } from "@/components/kairso/pickers";
import { IconClose, IconPaperclip } from "@/components/icons";
import { tr } from "@/lib/i18n";

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
  const images = (f.images ?? []).map((src) => `![${tr().createTask.attachment}](${src})`).join("\n");
  return {
    title: f.featureName.slice(0, 200),
    description: [tr().createTask.fromFeedbackNote(f.code, who), f.content, images].filter(Boolean).join("\n\n"),
    priority: f.priority || undefined,
    end: f.expectedFixDate ? f.expectedFixDate.slice(0, 10) : undefined,
  };
}

export function CreateTaskDialog({ defaults, onClose }: { defaults: CreateTaskDefaults | null; onClose: () => void }) {
  return (
    <Modal open={!!defaults} onClose={onClose} title={defaults?.parentId ? tr().createTask.subtask : defaults?.feedbackId ? tr().createTask.fromFeedback : defaults?.meetingId ? tr().createTask.fromMeeting : tr().createTask.create} width={1040}>
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
      tr().createTask.fromMinutesNote(m.title, fmtDate(m.meetingDate)),
      it.module ? tr().createTask.moduleLine(it.module) : "",
      it.content,
      it.note ? tr().createTask.noteLine(it.note) : "",
    ].filter(Boolean).join("\n\n"),
    priority: it.priority ? priorityToApi(1) : undefined,
    moduleId: mod ? modules.find((x) => x.name.trim().toLowerCase() === mod)?.id : undefined,
  };
}

function FromMeeting({ defaults, onClose }: { defaults: CreateTaskDefaults; onClose: () => void }) {
  const { workspaceId } = useWorkspace();
  const meeting = useMeeting(defaults.meetingId);
  const modules = useProjectModules(workspaceId, defaults.projectId ?? "");
  if (meeting.isLoading || (defaults.projectId && modules.isLoading)) return <p className="py-6 text-center text-[13px] text-ink-muted">{tr().createTask.loadingMinutes}</p>;
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
  if (list.isLoading) return <p className="py-6 text-center text-[13px] text-ink-muted">{tr().createTask.loadingFeedback}</p>;
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
  const [files, setFiles] = useState<File[]>([]);
  const [attaching, setAttaching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const members = useProjectMembers(workspaceId, projectId);
  const labels = useProjectLabels(workspaceId, projectId);
  const modules = useProjectModules(workspaceId, projectId);
  const createLabel = useCreateLabel(workspaceId, projectId);
  const create = useCreateTask(workspaceId, projectId);
  const { link } = useFeedbackMutations(workspaceId, projectId);
  const qc = useQueryClient();

  const people = (members.data ?? []).map((m) => ({ id: m.userId, name: m.userName, avatar: m.userAvatar, alias: m.userAlias }));
  const dateError = start && end && end < start ? tr().createTask.dueAfterStart : null;
  const canSubmit = !!projectId && title.trim().length > 0 && !dateError;

  // Upload the picked files and attach them to the new task. Failures are
  // reported but do not undo the task.
  const attachFiles = async (taskId: string) => {
    if (files.length === 0) return;
    setAttaching(true);
    const failed: string[] = [];
    for (const f of files) {
      try {
        const up = await uploadFile(f, "task_file", taskId);
        await postTaskAttachments(taskId, { fileName: up.fileName, fileUrl: up.fileUrl, contentType: up.contentType, sizeBytes: up.sizeBytes });
      } catch {
        failed.push(f.name);
      }
    }
    setAttaching(false);
    qc.invalidateQueries({ queryKey: ["task-attachments", taskId] });
    if (failed.length) toast.error(tr().createTask.attachFailed(failed.join(", ")));
  };

  const submit = () => {
    if (!canSubmit || attaching) return;
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
          await attachFiles(task.id);
          if (defaults.feedbackId) {
            try {
              await link.mutateAsync({ id: defaults.feedbackId, taskId: task.id });
              toast.success(tr().createTask.createdLinked(task.code));
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
              toast.success(tr().createTask.createdAttached(task.code));
            } catch (e) {
              toast.error(e);
            }
            onClose();
            return;
          }
          toast.success(tr().createTask.created(task.code));
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
        <Field label={tr().createTask.project} required>
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
      <Field label={tr().createTask.title} required>
        {(p) => <Input {...p} autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tr().createTask.titlePh} maxLength={200} />}
      </Field>
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-ink-2">{tr().createTask.description}</span>
        <MarkdownEditor
          label={tr().createTask.descriptionLabel}
          height={380}
          value={description}
          onChange={setDescription}
          onSubmit={submit}
          placeholder={tr().createTask.descriptionPh}
          onUploadImage={projectId ? async (f) => (await uploadFile(f, "project_file", projectId)).fileUrl : undefined}
        />
      </div>

      <div className="grid grid-cols-[108px_1fr] items-center gap-x-3 gap-y-2.5 max-sm:grid-cols-1">
        <span className="text-[12px] text-ink-muted">{tr().createTask.status}</span>
        <div><StatusPicker value={status} onChange={setStatus} /></div>
        <span className="text-[12px] text-ink-muted">{tr().createTask.priority}</span>
        <div><PriorityPicker value={priority} onChange={setPriority} /></div>
        <span className="text-[12px] text-ink-muted">Module</span>
        <div><ModulePicker modules={modules.data ?? []} value={moduleId ?? undefined} onChange={setModuleId} /></div>
        <span className="text-[12px] text-ink-muted">{tr().createTask.workers}</span>
        <div><PeoplePicker title={tr().createTask.workers} emptyLabel={tr().createTask.unassigned} people={people} value={workers} onChange={setWorkers} /></div>
        <span className="text-[12px] text-ink-muted">{tr().createTask.faultHolders}</span>
        <div><PeoplePicker title={tr().createTask.faultHolders} emptyLabel={tr().createTask.noneSet} people={people} value={faultHolders} onChange={setFaultHolders} /></div>
        <span className="text-[12px] text-ink-muted">{tr().createTask.labels}</span>
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
        <span className="text-[12px] text-ink-muted">{tr().createTask.startDue}</span>
        <div className="flex flex-wrap items-center gap-2">
          <DateField label={tr().createTask.startDate} value={start} onChange={setStart} />
          <span className="text-ink-faint">→</span>
          <DateField label={tr().createTask.dueDate} value={end} onChange={setEnd} min={start || undefined} />
          {dateError && <span className="text-[12px] text-danger">{dateError}</span>}
        </div>
        <label htmlFor="ct-est" className="text-[12px] text-ink-muted">{tr().createTask.estimate}</label>
        <div><Input id="ct-est" small type="number" min={0} inputMode="numeric" className="w-24 font-mono" value={estimation} onChange={(e) => setEstimation(e.target.value)} placeholder="0" /></div>
        <span className="text-[12px] text-ink-muted">{tr().createTask.attachments}</span>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="sr-only"
            aria-label={tr().createTask.pickFiles}
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              if (picked.length) setFiles((prev) => [...prev, ...picked]);
              e.target.value = "";
            }}
          />
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`} className="inline-flex h-6 max-w-64 items-center gap-1 rounded-md bg-hover pl-2 pr-0.5 text-[12px] text-ink">
              <span className="truncate">{f.name}</span>
              <span className="shrink-0 text-ink-faint">{fmtBytes(f.size)}</span>
              <button type="button" aria-label={tr().createTask.removeFile(f.name)} onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="grid size-5 place-items-center rounded text-ink-faint hover:text-danger">
                <IconClose size={10} />
              </button>
            </span>
          ))}
          <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
            <IconPaperclip size={13} /> {tr().createTask.addFiles}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
        <span className="mr-auto text-[11px] text-ink-faint max-sm:hidden">{tr().createTask.shortcut}</span>
        <Button onClick={onClose}>{tr().createTask.cancel}</Button>
        <Button type="submit" variant="primary" loading={create.isPending || attaching} disabled={!canSubmit}>
          {tr().createTask.create}
        </Button>
      </div>
    </form>
  );
}
