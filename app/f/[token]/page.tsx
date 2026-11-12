"use client";

import { use, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPublicProject, getPublicProjectFeedbacks, getPublicProjectFiles, getPublicProjectModules, postPublicProjectFeedbacks, postPublicProjectUploadsPresignedUrl } from "@/lib/api/endpoints";
import type { FileResponse, TreeNode } from "@/lib/api/schema";
import { fmtBytes } from "@/lib/upload";
import { qk } from "@/lib/query/keys";
import { FEEDBACK_STATUSES, FEEDBACK_STATUS_LABEL, FEEDBACK_STATUS_TONE, FEEDBACK_TYPES, FEEDBACK_TYPE_LABEL, FEEDBACK_TYPE_TONE } from "@/lib/domain/feedback";
import { MODULE_STATUS_COLOR, MODULE_STATUS_LABEL, SPRINT_STATUS_COLOR, SPRINT_STATUS_LABEL, moduleTimelineBars, type ModuleStatus, type SprintStatus } from "@/lib/domain/module";
import { PRIORITY_LEVELS, PRIORITY_META, priorityToApi } from "@/lib/domain/task";
import { fmtDate } from "@/lib/domain/format";
import { Button } from "@/components/ui/Button";
import { Alert, Badge, EmptyState, Skeleton } from "@/components/ui/feedback";
import { Field, Input, SearchInput, Select, Textarea } from "@/components/ui/form";
import { IconChat, IconChevronRight, IconClose, IconDownload, IconFile, IconFolder, IconPlus } from "@/components/icons";
import { ToastProvider, useToast } from "@/lib/toast/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Gantt, type GanttRow } from "@/components/project/Gantt";
import { tr } from "@/lib/i18n";
import { LangToggle } from "@/components/shell/LangToggle";

const PAGE = 20;

export default function PublicFeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <ToastProvider><Board token={token} /></ToastProvider>;
}

function Board({ token }: { token: string }) {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const project = useQuery({ queryKey: qk.publicProject(token), queryFn: () => getPublicProject(token), retry: false });
  const filter = { status: status || undefined, feedbackType: type || undefined, q: q || undefined };
  const list = useInfiniteQuery({
    queryKey: qk.publicFeedbacks(token, filter),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getPublicProjectFeedbacks(token, { ...filter, page: pageParam, limit: PAGE }),
    getNextPageParam: (l) => (l.hasMore ? (l.page ?? 1) + 1 : undefined),
    enabled: !!project.data?.enabled,
  });
  const modules = useQuery({ queryKey: ["public-modules", token], queryFn: async () => (await getPublicProjectModules(token)) ?? [], enabled: !!project.data?.enabled && !!project.data.showModuleTimeline });
  const files = useQuery({ queryKey: ["public-files", token], queryFn: () => getPublicProjectFiles(token), enabled: !!project.data?.enabled });
  const hasFiles = (files.data?.folders?.length ?? 0) > 0 || (files.data?.rootFiles?.length ?? 0) > 0;
  const items = list.data?.pages.flatMap((p) => p.items ?? []) ?? [];
  const moduleRows = useMemo<GanttRow[]>(
    () =>
      (modules.data ?? []).map((m, i) => {
        const status = m.status as ModuleStatus;
        return {
          id: `${i}-${m.name}`,
          label: (
            <span className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] text-ink-muted"><span className="size-2 rounded-full" style={{ background: MODULE_STATUS_COLOR[status] }} aria-hidden="true" />{MODULE_STATUS_LABEL[status] ?? m.status}</span>
            </span>
          ),
          bars: moduleTimelineBars({ ...m, sprints: (m.sprints ?? []).map((s) => ({ ...s, status: s.status as SprintStatus })) }, fmtDate),
        };
      }).filter((r) => r.bars.length > 0),
    [modules.data],
  );
  const hasSprints = (modules.data ?? []).some((m) => (m.sprints ?? []).length > 0);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-[960px] items-center gap-3 px-4">
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-accent text-[13px] font-bold text-accent-on">K</span>
          <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{project.data?.projectName ?? tr().publicFb.fallbackTitle}</h1>
          <LangToggle />
          {project.data?.enabled && <Button variant="primary" onClick={() => setOpen(true)}><IconPlus size={14} /> {tr().publicFb.send}</Button>}
        </div>
      </header>
      <main className="mx-auto flex max-w-[960px] flex-col gap-5 px-4 py-6">
        {project.isLoading ? <Skeleton className="h-40" /> : project.isError ? (
          <EmptyState icon={<IconChat size={28} />} title={tr().publicFb.notFound} description={tr().publicFb.notFoundDesc} />
        ) : !project.data?.enabled ? (
          <EmptyState icon={<IconChat size={28} />} title={tr().publicFb.closed} description={tr().publicFb.closedDesc} />
        ) : (
          <>
            {project.data?.showModuleTimeline && (modules.data ?? []).length > 0 && (
              <section aria-labelledby="pf-mod" className="overflow-hidden rounded-lg border border-line bg-surface">
                <h2 id="pf-mod" className="px-4 pt-3 pb-2 text-[13px] font-semibold">{tr().publicFb.progress}</h2>
                <Gantt rows={moduleRows} defaultZoom="month" scrollToToday empty={<p className="px-4 pb-4 text-[13px] text-ink-muted">{tr().publicFb.noSprints}</p>} />
                {moduleRows.length > 0 && (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-[12px] text-ink-muted" aria-label={tr().publicFb.legend}>
                    {hasSprints && (["completed", "active", "planned"] as SprintStatus[]).map((s) => (
                      <li key={s} className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: SPRINT_STATUS_COLOR[s] }} aria-hidden="true" />Sprint {SPRINT_STATUS_LABEL[s].toLowerCase()}</li>
                    ))}
                    <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: MODULE_STATUS_COLOR.released }} aria-hidden="true" />{tr().publicFb.releaseDate}</li>
                  </ul>
                )}
              </section>
            )}
            {hasFiles && (
              <section aria-labelledby="pf-files" className="overflow-hidden rounded-lg border border-line bg-surface">
                <h2 id="pf-files" className="px-4 pt-3 pb-2 text-[13px] font-semibold">{tr().publicFb.docs}</h2>
                <div className="px-2 pb-3">
                  {files.data?.folders?.map((n) => <PublicFolder key={n.id} node={n} depth={0} />)}
                  {files.data?.rootFiles?.map((f) => <PublicFile key={f.id} file={f} depth={0} />)}
                </div>
              </section>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={q} onChange={setQ} placeholder={tr().publicFb.searchPh} label={tr().publicFb.search} className="w-[240px]" />
              <Select small aria-label={tr().publicFb.filterStatus} className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">{tr().publicFb.allStatuses}</option>{FEEDBACK_STATUSES.map((s) => <option key={s} value={s}>{FEEDBACK_STATUS_LABEL[s]}</option>)}</Select>
              <Select small aria-label={tr().publicFb.filterType} className="w-36" value={type} onChange={(e) => setType(e.target.value)}><option value="">{tr().publicFb.allTypes}</option>{FEEDBACK_TYPES.map((t) => <option key={t} value={t}>{FEEDBACK_TYPE_LABEL[t]}</option>)}</Select>
            </div>
            {list.isLoading ? <Skeleton className="h-64" /> : items.length === 0 ? <EmptyState icon={<IconChat size={28} />} title={tr().publicFb.none} description={tr().publicFb.noneDesc} className="rounded-lg border border-line bg-surface py-14" /> : (
              <ul className="flex flex-col gap-3">
                {items.map((f) => (
                  <li key={f.id} className="rounded-lg border border-line bg-surface p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11.5px] text-ink-faint">{f.code}</span>
                      <h3 className="min-w-0 flex-1 text-[14px] font-semibold">{f.featureName}</h3>
                      <Badge tone={FEEDBACK_TYPE_TONE[f.feedbackType]}>{FEEDBACK_TYPE_LABEL[f.feedbackType]}</Badge>
                      <Badge tone={FEEDBACK_STATUS_TONE[f.status]}>{FEEDBACK_STATUS_LABEL[f.status]}</Badge>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] text-ink-2">{f.content}</p>
                    {(f.images ?? []).length > 0 && <div className="mt-2 flex flex-wrap gap-2">{(f.images ?? []).map((src) => <a key={src} href={src} target="_blank" rel="noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt={tr().publicFb.image} className="h-20 rounded-md border border-line object-cover" /></a>)}</div>}
                    {f.response && (
                      <div className="mt-3 rounded-md border-l-2 border-accent bg-accent-soft px-3 py-2 text-[13px]">
                        <p className="text-[11.5px] font-medium text-accent-ink">{tr().publicFb.teamResponse(f.expectedFixDate ? fmtDate(f.expectedFixDate) : "")}</p>
                        <p className="whitespace-pre-wrap text-ink-2">{f.response}</p>
                      </div>
                    )}
                    <p className="mt-2 text-[11.5px] text-ink-faint">{f.submitterName}{f.submitterCompany ? ` · ${f.submitterCompany}` : ""} · {fmtDate(f.createdAt)}</p>
                  </li>
                ))}
                {list.hasNextPage && <li className="text-center"><Button loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>{tr().publicFb.loadMore}</Button></li>}
              </ul>
            )}
          </>
        )}
      </main>
      <Modal open={open} onClose={() => setOpen(false)} title={tr().publicFb.send} description={tr().publicFb.publicNote} width={560}><SubmitForm token={token} onClose={() => setOpen(false)} /></Modal>
    </div>
  );
}

function PublicFolder({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const name = node.name ?? "";
  const empty = !node.children?.length && !node.files?.length;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-full items-center gap-1.5 rounded-md pr-1 text-left hover:bg-hover"
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        <IconChevronRight size={13} className={`shrink-0 text-ink-faint transition-transform ${open ? "rotate-90" : ""}`} />
        <IconFolder size={15} className="shrink-0 text-accent" />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">{name}</span>
      </button>
      {open && (
        <div>
          {node.children?.map((c) => <PublicFolder key={c.id} node={c} depth={depth + 1} />)}
          {node.files?.map((f) => <PublicFile key={f.id} file={f} depth={depth + 1} />)}
          {empty && <p className="py-1 text-[11.5px] text-ink-faint" style={{ paddingLeft: (depth + 1) * 16 + 24 }}>{tr().publicFb.empty}</p>}
        </div>
      )}
    </div>
  );
}

function PublicFile({ file, depth }: { file: FileResponse; depth: number }) {
  return (
    <a
      href={file.url ?? ""}
      target="_blank"
      rel="noreferrer"
      download
      className="group flex h-8 items-center gap-1.5 rounded-md pr-1 hover:bg-hover"
      style={{ paddingLeft: depth * 16 + 24 }}
    >
      <IconFile size={15} className="shrink-0 text-ink-faint" />
      <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{file.name ?? ""}</span>
      <span className="hidden shrink-0 font-mono text-[11px] text-ink-faint sm:block">{fmtBytes(file.sizeBytes)}</span>
      <IconDownload size={14} className="shrink-0 text-ink-faint group-hover:text-ink" />
    </a>
  );
}

function SubmitForm({ token, onClose }: { token: string; onClose: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [f, setF] = useState({ featureName: "", content: "", feedbackType: "feature", priority: priorityToApi(2), submitterName: "", submitterCompany: "" });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const ok = f.featureName.trim() && f.content.trim() && f.submitterName.trim();

  const send = useMutation({
    mutationFn: () => postPublicProjectFeedbacks(token, { ...f, featureName: f.featureName.trim(), content: f.content.trim(), submitterName: f.submitterName.trim(), submitterCompany: f.submitterCompany.trim(), images }),
    onSuccess: () => { toast.success(tr().publicFb.thanks); qc.invalidateQueries({ queryKey: ["public-feedbacks"] }); onClose(); },
    onError: (e) => toast.error(e),
  });

  const addImages = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    try {
      for (const file of list) {
        const p = await postPublicProjectUploadsPresignedUrl(token, { contentType: file.type || "image/jpeg", filename: file.name });
        const r = await fetch(p.uploadUrl, { method: p.method || "PUT", headers: { "Content-Type": file.type || "image/jpeg" }, body: file });
        if (!r.ok) throw new Error(tr().publicFb.uploadFailed(r.status));
        setImages((x) => [...x, p.fileUrl]);
      }
    } catch (e) { toast.error(e); } finally { setUploading(false); if (ref.current) ref.current.value = ""; }
  };

  return (
    <form onSubmit={(e) => (e.preventDefault(), ok && send.mutate())} className="flex flex-col gap-3.5">
      <Field label={tr().publicFb.feature} required>{(p) => <Input {...p} autoFocus value={f.featureName} onChange={(e) => set("featureName", e.target.value)} maxLength={150} />}</Field>
      <Field label={tr().publicFb.content} required>{(p) => <Textarea {...p} rows={4} value={f.content} onChange={(e) => set("content", e.target.value)} />}</Field>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <Field label={tr().publicFb.type}>{(p) => <Select {...p} value={f.feedbackType} onChange={(e) => set("feedbackType", e.target.value)}>{FEEDBACK_TYPES.map((t) => <option key={t} value={t}>{FEEDBACK_TYPE_LABEL[t]}</option>)}</Select>}</Field>
        <Field label={tr().publicFb.importance}>{(p) => <Select {...p} value={f.priority} onChange={(e) => set("priority", Number(e.target.value))}>{PRIORITY_LEVELS.map((l) => <option key={l} value={PRIORITY_META[l].api}>{PRIORITY_META[l].label}</option>)}</Select>}</Field>
        <Field label={tr().publicFb.name} required>{(p) => <Input {...p} value={f.submitterName} onChange={(e) => set("submitterName", e.target.value)} />}</Field>
        <Field label={tr().publicFb.company}>{(p) => <Input {...p} value={f.submitterCompany} onChange={(e) => set("submitterCompany", e.target.value)} />}</Field>
      </div>
      <div>
        <input ref={ref} type="file" accept="image/*" multiple className="sr-only" aria-label={tr().publicFb.pickImages} onChange={(e) => addImages(e.target.files)} />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" loading={uploading} onClick={() => ref.current?.click()}>{tr().publicFb.attachImages}</Button>
          {images.map((src, i) => <span key={src} className="relative">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt={tr().publicFb.imageN(i + 1)} className="h-12 rounded border border-line object-cover" /><button type="button" aria-label={tr().publicFb.removeImage(i + 1)} onClick={() => setImages((x) => x.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 rounded-full bg-surface p-0.5 shadow"><IconClose size={10} /></button></span>)}
        </div>
      </div>
      {send.isError && <Alert tone="danger">{send.error instanceof Error ? send.error.message : tr().publicFb.sendFailed}</Alert>}
      <div className="flex justify-end gap-2 border-t border-line pt-3"><Button onClick={onClose}>{tr().publicFb.cancel}</Button><Button type="submit" variant="primary" loading={send.isPending} disabled={!ok || uploading}>{tr().publicFb.submit}</Button></div>
    </form>
  );
}
