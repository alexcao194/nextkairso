"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { MeetingItem, MeetingMinutesResponse, MeetingParticipant, TaskResponse } from "@/lib/api/schema";
import { SECTION_META, SECTION_ORDER, isBlankItem, itemAssignment, meetingToMarkdown, newMeetingItem, toDateInput, todayKey, type MeetingSection } from "@/lib/domain/meeting";
import { fmtDate, fmtRelative } from "@/lib/domain/format";
import { useLinkedTasks, useMeetingMutations, useMeetings } from "@/lib/hooks/meetings";
import type { ResourceScope } from "@/lib/hooks/resources";
import { useProjectModules } from "@/lib/hooks/tasks";
import { useToast } from "@/lib/toast/ToastProvider";
import { useDialogs } from "@/components/dialogs/DialogProvider";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/feedback";
import { Menu } from "@/components/ui/Popover";
import { StatusChip } from "@/components/kairso/StatusChip";
import { IconArrowRight, IconClose, IconCopy, IconDownload, IconMore, IconPlus, IconTrash } from "@/components/icons";
import { ParticipantPicker } from "./ParticipantPicker";
import { tr } from "@/lib/i18n";

interface Draft {
  title: string;
  meetingDate: string;
  location: string;
  attendees: MeetingParticipant[];
  recorders: MeetingParticipant[];
  summary: string;
  items: MeetingItem[];
  sectionNotes: Record<string, string>;
}

const fromServer = (m: MeetingMinutesResponse | null): Draft => ({
  title: m?.title ?? "",
  meetingDate: toDateInput(m?.meetingDate) || todayKey(),
  location: m?.location ?? "",
  attendees: m?.attendees ?? [],
  recorders: m?.recorders ?? [],
  summary: m?.summary ?? "",
  items: (m?.items ?? []).map((i) => ({ ...i, tasks: i.tasks ?? [] })),
  sectionNotes: { ...(m?.sectionNotes ?? {}) },
});

const cellText =
  "block w-full resize-y rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[13px] leading-snug text-ink outline-none [field-sizing:content] placeholder:text-ink-placeholder hover:border-line-strong focus:border-accent focus:bg-surface focus:ring-1 focus:ring-accent";
const cellInput =
  "h-ctl-sm w-full rounded-md border border-transparent bg-transparent px-1.5 text-[12.5px] text-ink outline-none placeholder:text-ink-placeholder hover:border-line-strong focus:border-accent focus:bg-surface focus:ring-1 focus:ring-accent";

export function MeetingEditor({ scope, meeting, onClose, onCreated }: { scope: ResourceScope; meeting: MeetingMinutesResponse | null; onClose: () => void; onCreated: (id: string) => void }) {
  const toast = useToast();
  const { openCreateTask } = useDialogs();
  const { create, update } = useMeetingMutations(scope);
  const modules = useProjectModules(scope.ws, scope.projectId ?? "");
  const others = useMeetings(scope);
  const [draft, setDraft] = useState<Draft>(() => fromServer(meeting));

  const base = useMemo(() => JSON.stringify(fromServer(meeting)), [meeting]);
  const dirty = JSON.stringify(draft) !== base;

  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    if (!dirtyRef.current) setDraft(fromServer(meeting));
  }, [meeting]);

  const taskIds = useMemo(() => [...new Set(draft.items.flatMap((i) => (i.tasks ?? []).map((t) => t.id)))], [draft.items]);
  const linked = useLinkedTasks(taskIds);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setItem = (id: string, patch: Partial<MeetingItem>) => setDraft((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const addItem = (s: MeetingSection) => setDraft((d) => ({ ...d, items: [...d.items, newMeetingItem(s)] }));
  const removeItem = (id: string) => setDraft((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
  const moveItem = (id: string, section: MeetingSection) =>
    setDraft((d) => {
      const it = d.items.find((i) => i.id === id);
      return it ? { ...d, items: [...d.items.filter((i) => i.id !== id), { ...it, section }] } : d;
    });

  const moduleNames = useMemo(() => {
    const names = new Set<string>((modules.data ?? []).map((m) => m.name));
    for (const i of draft.items) if (i.module.trim()) names.add(i.module.trim());
    return [...names].sort((a, b) => a.localeCompare(b, "vi"));
  }, [modules.data, draft.items]);

  const usedGroups = useMemo(() => {
    const names = new Set<string>();
    for (const m of others.data ?? []) for (const p of [...(m.attendees ?? []), ...(m.recorders ?? [])]) if (!p.userId) names.add(p.name);
    return [...names];
  }, [others.data]);

  const missingContent = draft.items.some((i) => !isBlankItem(i) && !i.content.trim());
  const canSave = !!draft.title.trim() && !!draft.meetingDate && !missingContent;
  const busy = create.isPending || update.isPending;
  const savedBlock = !meeting ? "new" : dirty ? "dirty" : null;

  const save = () => {
    if (!canSave) return;
    const body = { ...draft, title: draft.title.trim(), items: draft.items.filter((i) => !isBlankItem(i)) };
    if (!meeting)
      create.mutate(body, {
        onSuccess: (m) => {
          toast.success(tr().meetingEd.created);
          onCreated(m.id);
        },
        onError: (e) => toast.error(e),
      });
    else update.mutate({ id: meeting.id, body }, { onSuccess: () => toast.success(tr().meetingEd.saved), onError: (e) => toast.error(e) });
  };

  const copyMarkdown = () =>
    navigator.clipboard.writeText(meetingToMarkdown({ ...draft, items: draft.items.filter((i) => !isBlankItem(i)) })).then(
      () => toast.success(tr().meetingEd.copied),
      () => toast.error(tr().meetingEd.copyFailed),
    );

  const listId = `meeting-modules-${meeting?.id ?? "new"}`;

  return (
    <form
      onSubmit={(e) => (e.preventDefault(), save())}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
      }}
      className="flex flex-col gap-5"
    >
      <datalist id={listId}>
        {moduleNames.map((n) => <option key={n} value={n} />)}
      </datalist>

      <section aria-label={tr().meetingEd.general} className="flex flex-col gap-3">
        <Field label={tr().meetingEd.title} required>
          {(p) => <Input {...p} autoFocus={!meeting} value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder={tr().meetingEd.titlePh} maxLength={255} />}
        </Field>
        <div className="grid grid-cols-[160px_1fr] gap-3 max-sm:grid-cols-1">
          <Field label={tr().meetingEd.time} required>{(p) => <Input {...p} type="date" value={draft.meetingDate} onChange={(e) => set("meetingDate", e.target.value)} />}</Field>
          <Field label={tr().meetingEd.location}>{(p) => <Input {...p} value={draft.location} onChange={(e) => set("location", e.target.value)} placeholder={tr().meetingEd.locationPh} />}</Field>
        </div>
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <ParticipantPicker label={tr().meetingEd.attendees} value={draft.attendees} onChange={(v) => set("attendees", v)} groups={usedGroups} placeholder={tr().meetingEd.attendeesPh} />
          <ParticipantPicker label={tr().meetingEd.recorders} value={draft.recorders} onChange={(v) => set("recorders", v)} groups={usedGroups} />
        </div>
        <Field label={tr().meetingEd.summary}>
          {(p) => <Textarea {...p} rows={2} value={draft.summary} onChange={(e) => set("summary", e.target.value)} placeholder={tr().meetingEd.summaryPh} />}
        </Field>
      </section>

      {SECTION_ORDER.map((s, idx) => (
        <SectionTable
          key={s}
          index={idx + 1}
          section={s}
          items={draft.items.filter((i) => i.section === s)}
          tasks={linked.map}
          note={draft.sectionNotes[s] ?? ""}
          moduleListId={listId}
          taskBlocked={savedBlock && tr().meetingEd.blockedTask(savedBlock === "new")}
          onNote={(v) => set("sectionNotes", { ...draft.sectionNotes, [s]: v })}
          onAdd={() => addItem(s)}
          onChange={setItem}
          onRemove={removeItem}
          onMove={moveItem}
          onCreateTask={(it) => meeting && openCreateTask({ projectId: scope.projectId, meetingId: meeting.id, meetingItemId: it.id })}
        />
      ))}

      <div className="sticky -bottom-4 z-10 -mx-5 -mb-4 flex flex-wrap items-center gap-2 border-t border-line bg-surface px-5 py-3">
        {meeting && <span className="text-[11.5px] text-ink-faint max-sm:hidden">{tr().meetingEd.editedAgo(meeting.createdBy?.name ?? "", fmtRelative(meeting.updatedAt))}</span>}
        {missingContent && <span role="alert" className="text-[12px] text-danger">{tr().meetingEd.emptyRow}</span>}
        <span className="flex-1" />
        <Button size="sm" variant="ghost" onClick={copyMarkdown}><IconCopy size={13} /> Markdown</Button>
        {meeting && (
          <a
            href={savedBlock ? undefined : `/print/meetings/${meeting.id}?auto=1`}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!!savedBlock}
            title={savedBlock ? tr().meetingEd.blockedPdf(savedBlock === "new") : undefined}
            className={`inline-flex h-ctl-sm items-center gap-1.5 rounded-md border border-line-strong px-2.5 text-[12.5px] font-medium text-ink ${savedBlock ? "pointer-events-none opacity-50" : "hover:bg-hover"}`}
          >
            <IconDownload size={13} /> {tr().meetingEd.exportPdf}
          </a>
        )}
        <Button onClick={onClose}>{dirty ? tr().meetingEd.cancel : tr().meetingEd.close}</Button>
        <Button type="submit" variant="primary" loading={busy} disabled={!canSave || (!!meeting && !dirty)}>
          {meeting ? tr().meetingEd.save : tr().meetingEd.create}
        </Button>
      </div>
    </form>
  );
}

function SectionTable({
  index,
  section,
  items,
  tasks,
  note,
  moduleListId,
  taskBlocked,
  onNote,
  onAdd,
  onChange,
  onRemove,
  onMove,
  onCreateTask,
}: {
  index: number;
  section: MeetingSection;
  items: MeetingItem[];
  tasks: Map<string, TaskResponse>;
  note: string;
  moduleListId: string;
  taskBlocked: string | null;
  onNote: (v: string) => void;
  onAdd: () => void;
  onChange: (id: string, patch: Partial<MeetingItem>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, s: MeetingSection) => void;
  onCreateTask: (it: MeetingItem) => void;
}) {
  const meta = SECTION_META[section];
  const priorityCount = items.filter((i) => i.priority).length;

  return (
    <section aria-labelledby={`sec-${section}`} className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-semibold text-accent-on">{index}</span>
        <h3 id={`sec-${section}`} className="text-[14px] font-semibold">{meta.label}</h3>
        <span className="font-mono text-[11.5px] text-ink-faint">{items.length}</span>
        {priorityCount > 0 && <Badge tone="danger">{tr().meetingEd.priorityCount(priorityCount)}</Badge>}
        <span className="truncate text-[12px] text-ink-faint max-sm:hidden">— {meta.hint}</span>
      </div>

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead className="bg-surface-sunken text-left text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              <tr className="h-thead border-b border-line">
                <th className="w-10 px-2">STT</th>
                <th className="w-40 px-1.5">{tr().meetingEd.module}</th>
                <th className="px-1.5">{meta.contentLabel}</th>
                <th className="w-44 px-1.5">{tr().meetingEd.note}</th>
                {meta.tasks && <th className="w-16 px-1.5 text-center">{tr().meetingEd.priority}</th>}
                {meta.tasks && <th className="w-60 px-1.5">{tr().meetingEd.taskCol}</th>}
                {meta.status && <th className="w-32 px-1.5">{tr().meetingEd.status}</th>}
                <th className="w-9 px-1"><span className="sr-only">{tr().meetingEd.actions}</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className="border-b border-line-row align-top last:border-b-0">
                  <td className="px-2 py-1.5 font-mono text-[12px] text-ink-faint">{i + 1}</td>
                  <td className="px-0.5 py-1">
                    <input aria-label={tr().meetingEd.rowModule(i + 1)} list={moduleListId} value={it.module} onChange={(e) => onChange(it.id, { module: e.target.value })} placeholder={tr().meetingEd.module} className={`${cellInput} font-medium`} />
                  </td>
                  <td className="px-0.5 py-1">
                    <textarea
                      aria-label={tr().meetingEd.rowContent(meta.contentLabel, i + 1)}
                      rows={1}
                      autoFocus={!it.content && !it.module}
                      value={it.content}
                      onChange={(e) => onChange(it.id, { content: e.target.value })}
                      placeholder={tr().meetingEd.contentPh}
                      className={cellText}
                    />
                  </td>
                  <td className="px-0.5 py-1">
                    <textarea aria-label={tr().meetingEd.rowNote(i + 1)} rows={1} value={it.note} onChange={(e) => onChange(it.id, { note: e.target.value })} placeholder="—" className={`${cellText} text-[12.5px] text-ink-2`} />
                  </td>
                  {meta.tasks && (
                    <td className="px-0.5 py-1 text-center">
                      <input type="checkbox" aria-label={tr().meetingEd.rowPriority(i + 1)} checked={it.priority} onChange={(e) => onChange(it.id, { priority: e.target.checked })} className="mt-1.5 size-4 cursor-pointer accent-[var(--danger)]" />
                    </td>
                  )}
                  {meta.tasks && (
                    <td className="px-1.5 py-1.5">
                      <ItemTasks item={it} tasks={tasks} blocked={taskBlocked} onUnlink={(id) => onChange(it.id, { tasks: (it.tasks ?? []).filter((t) => t.id !== id) })} onCreate={() => onCreateTask(it)} />
                    </td>
                  )}
                  {meta.status && (
                    <td className="px-0.5 py-1">
                      <select
                        aria-label={tr().meetingEd.rowStatus(i + 1)}
                        value={it.status}
                        onChange={(e) => onChange(it.id, { status: e.target.value as MeetingItem["status"] })}
                        className={`${cellInput} ${it.status === "done" ? "text-success" : ""}`}
                      >
                        <option value="open">{meta.status[0]}</option>
                        <option value="done">{meta.status[1]}</option>
                      </select>
                    </td>
                  )}
                  <td className="px-1 py-1">
                    <Menu
                      align="end"
                      trigger={({ ref, open: _o, ...p }) => (
                        <IconButton ref={ref} label={tr().meetingEd.rowActions(i + 1)} variant="ghost" size="sm" {...p}>
                          <IconMore size={14} />
                        </IconButton>
                      )}
                      items={[
                        ...SECTION_ORDER.filter((x) => x !== section).map((x) => ({ label: tr().meetingEd.moveTo(SECTION_META[x].label), icon: <IconArrowRight size={14} />, onSelect: () => onMove(it.id, x) })),
                        { label: tr().meetingEd.deleteRow, icon: <IconTrash size={14} />, danger: true, separated: true, onSelect: () => onRemove(it.id) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-start gap-2">
        <Button size="sm" variant="ghost" onClick={onAdd}><IconPlus size={13} /> {tr().meetingEd.addRow}</Button>
        <textarea
          aria-label={tr().meetingEd.sectionNote(meta.label)}
          rows={1}
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder={tr().meetingEd.sectionNotePh}
          className={`${cellText} min-w-[240px] flex-1 border-dashed border-line text-[12.5px]`}
        />
      </div>
    </section>
  );
}

function ItemTasks({ item, tasks, blocked, onUnlink, onCreate }: { item: MeetingItem; tasks: Map<string, TaskResponse>; blocked: string | null; onUnlink: (id: string) => void; onCreate: () => void }) {
  const refs = item.tasks ?? [];
  const { owners, due } = itemAssignment(refs.map((r) => tasks.get(r.id)));
  return (
    <div className="flex flex-col gap-1">
      {refs.map((r) => {
        const t = tasks.get(r.id);
        return (
          <span key={r.id} className="flex items-center gap-1.5 text-[12px]">
            <Link href={t ? `/projects/${t.projectId}/tasks?task=${t.id}` : "#"} className="font-mono text-accent-ink hover:underline">{t?.code ?? r.code}</Link>
            {t ? <StatusChip status={t.status} size="sm" /> : <span className="text-ink-faint">{tr().meetingEd.deleted}</span>}
            <button type="button" aria-label={tr().meetingEd.unlink(r.code)} onClick={() => onUnlink(r.id)} className="ml-auto text-ink-faint hover:text-danger">
              <IconClose size={11} />
            </button>
          </span>
        );
      })}
      {(owners.length > 0 || due) && (
        <span className="text-[11.5px] leading-snug text-ink-muted">
          {owners.length > 0 && owners.join(", ")}
          {owners.length > 0 && due && " · "}
          {due && tr().meetingEd.dueOn(fmtDate(due))}
        </span>
      )}
      <button
        type="button"
        disabled={!!blocked || !item.content.trim()}
        title={blocked ?? (!item.content.trim() ? tr().meetingEd.needContent : undefined)}
        onClick={onCreate}
        className="inline-flex w-fit items-center gap-1 rounded-md px-1 text-[12px] text-ink-muted hover:bg-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        <IconPlus size={12} /> {refs.length ? tr().meetingEd.addTask : tr().meetingEd.createTask}
      </button>
    </div>
  );
}
