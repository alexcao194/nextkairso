"use client";

import { useRef, useState } from "react";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { fmtRelative } from "@/lib/domain/format";
import { fmtBytes, uploadFile } from "@/lib/upload";
import { useFiles, useLinks, useNotes, useResourceMutations, type LinkItem, type Note, type ResourceScope } from "@/lib/hooks/resources";
import { useMeetings } from "@/lib/hooks/meetings";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { MeetingList } from "./MeetingList";
import { Tabs } from "@/components/ui/Tabs";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/form";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { useConfirm } from "@/components/ui/Confirm";
import { IconEdit, IconExternal, IconFile, IconLink, IconNote, IconPlus, IconTrash } from "@/components/icons";

type Tab = "notes" | "meetings" | "links" | "files";
const TABS: Tab[] = ["notes", "meetings", "links", "files"];

export function ResourcePanel({ scope, className = "" }: { scope: ResourceScope; className?: string }) {
  const [rtab, setRtab] = useUrlState("rtab");
  const [meetingParam] = useUrlState("meeting");
  const tab: Tab = TABS.includes(rtab as Tab) ? (rtab as Tab) : meetingParam ? "meetings" : "notes";
  const setTab = (t: Tab) => setRtab(t === "notes" ? null : t);
  const notes = useNotes(scope);
  const meetings = useMeetings(scope);
  const links = useLinks(scope);
  const files = useFiles(scope);
  return (
    <section aria-label="Tài nguyên" className={`rounded-lg border border-line bg-surface ${className}`}>
      <Tabs
        label="Loại tài nguyên"
        value={tab}
        onChange={setTab}
        className="px-2"
        tabs={[
          { value: "notes", label: "Ghi chú", count: notes.data?.length },
          { value: "meetings", label: "Biên bản họp", count: meetings.data?.length },
          { value: "links", label: "Link", count: links.data?.length },
          { value: "files", label: "File", count: files.data?.length },
        ]}
      />
      {tab === "notes" && <Notes scope={scope} q={notes} />}
      {tab === "meetings" && <MeetingList scope={scope} />}
      {tab === "links" && <Links scope={scope} q={links} />}
      {tab === "files" && <Files scope={scope} q={files} />}
    </section>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => <li className="group flex min-h-11 items-center gap-2.5 border-b border-line-row px-3 py-1.5 last:border-b-0">{children}</li>;
const List = ({ q, empty, children }: { q: { isLoading: boolean; data?: unknown[] }; empty: string; children: React.ReactNode }) =>
  q.isLoading ? (
    <div className="p-3"><Skeleton className="h-9" /></div>
  ) : q.data?.length ? (
    <ul>{children}</ul>
  ) : (
    <EmptyState title={empty} className="py-8" />
  );

function Notes({ scope, q }: { scope: ResourceScope; q: ReturnType<typeof useNotes> }) {
  const { createNote, updateNote, deleteNote } = useResourceMutations(scope);
  const toast = useToast();
  const confirm = useConfirm();
  const [edit, setEdit] = useState<Note | "new" | null>(null);
  return (
    <div>
      <List q={q} empty="Chưa có ghi chú">
        {(q.data ?? []).map((n) => (
          <Row key={n.id}>
            <IconNote size={14} className="shrink-0 text-ink-faint" />
            <button type="button" onClick={() => setEdit(n)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13px] font-medium text-ink">{n.title || "Không tiêu đề"}</span>
              <span className="block truncate text-[11.5px] text-ink-faint">{n.createdBy?.name} · {fmtRelative(n.updatedAt)}</span>
            </button>
            <IconButton label={`Xoá ghi chú ${n.title}`} variant="ghost" size="sm" onClick={async () => { if (await confirm({ title: "Xoá ghi chú?", message: n.title, danger: true })) deleteNote.mutate(n.id, { onError: (e) => toast.error(e) }); }}>
              <IconTrash size={13} />
            </IconButton>
          </Row>
        ))}
      </List>
      <div className="border-t border-line p-2"><Button size="sm" variant="ghost" onClick={() => setEdit("new")}><IconPlus size={13} /> Ghi chú mới</Button></div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Ghi chú mới" : "Sửa ghi chú"} width={900}>
        {edit && (
          <NoteForm
            scope={scope}
            note={edit === "new" ? null : edit}
            busy={createNote.isPending || updateNote.isPending}
            onSave={(title, content) => {
              const done = { onSuccess: () => setEdit(null), onError: (e: unknown) => toast.error(e) };
              if (edit === "new") createNote.mutate({ title, content }, done);
              else updateNote.mutate({ id: edit.id, body: { title, content } }, done);
            }}
            onCancel={() => setEdit(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function NoteForm({ scope, note, busy, onSave, onCancel }: { scope: ResourceScope; note: Note | null; busy: boolean; onSave: (t: string, c: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const submit = () => title.trim() && onSave(title.trim(), content);
  return (
    <form onSubmit={(e) => (e.preventDefault(), submit())} className="flex flex-col gap-3">
      <Field label="Tiêu đề" required>{(p) => <Input {...p} autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-ink-2">Nội dung</span>
        <MarkdownEditor
          label="Nội dung ghi chú"
          height={380}
          value={content}
          onChange={setContent}
          onSubmit={submit}
          placeholder="Viết bằng Markdown. Dán hoặc kéo ảnh vào để chèn."
          onUploadImage={async (f) => (await uploadFile(f, scope.projectId ? "project_file" : "workspace_file", scope.projectId ?? scope.ws)).fileUrl}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Huỷ</Button>
        <Button type="submit" variant="primary" loading={busy} disabled={!title.trim()}>Lưu</Button>
      </div>
    </form>
  );
}

function Links({ scope, q }: { scope: ResourceScope; q: ReturnType<typeof useLinks> }) {
  const { createLink, updateLink, deleteLink } = useResourceMutations(scope);
  const toast = useToast();
  const [edit, setEdit] = useState<LinkItem | "new" | null>(null);
  return (
    <div>
      <List q={q} empty="Chưa có link">
        {(q.data ?? []).map((l) => (
          <Row key={l.id}>
            <IconLink size={14} className="shrink-0 text-ink-faint" />
            <a href={l.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink hover:text-accent-ink">{l.title || l.url}</span>
              <span className="block truncate font-mono text-[11px] text-ink-faint">{l.url}</span>
            </a>
            <IconExternal size={12} className="shrink-0 text-ink-faint" />
            {scope.projectId && <IconButton label={`Sửa ${l.title}`} variant="ghost" size="sm" onClick={() => setEdit(l)}><IconEdit size={13} /></IconButton>}
            <IconButton label={`Xoá ${l.title}`} variant="ghost" size="sm" onClick={() => deleteLink.mutate(l.id, { onError: (e) => toast.error(e) })}><IconTrash size={13} /></IconButton>
          </Row>
        ))}
      </List>
      <div className="border-t border-line p-2"><Button size="sm" variant="ghost" onClick={() => setEdit("new")}><IconPlus size={13} /> Thêm link</Button></div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Thêm link" : "Sửa link"} width={480}>
        {edit && (
          <LinkForm
            link={edit === "new" ? null : edit}
            busy={createLink.isPending || updateLink.isPending}
            onSave={(title, url) => {
              const done = { onSuccess: () => setEdit(null), onError: (e: unknown) => toast.error(e) };
              if (edit === "new") createLink.mutate({ title, url }, done);
              else updateLink.mutate({ id: edit.id, body: { title, url } }, done);
            }}
            onCancel={() => setEdit(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function LinkForm({ link, busy, onSave, onCancel }: { link: LinkItem | null; busy: boolean; onSave: (t: string, u: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(link?.title ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const valid = /^https?:\/\/\S+$/i.test(url.trim());
  return (
    <form onSubmit={(e) => (e.preventDefault(), valid && onSave(title.trim() || url.trim(), url.trim()))} className="flex flex-col gap-3">
      <Field label="Tiêu đề">{(p) => <Input {...p} autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
      <Field label="Đường dẫn" required error={url && !valid ? "Cần bắt đầu bằng http:// hoặc https://" : null}>{(p) => <Input {...p} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />}</Field>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Huỷ</Button>
        <Button type="submit" variant="primary" loading={busy} disabled={!valid}>Lưu</Button>
      </div>
    </form>
  );
}

function Files({ scope, q }: { scope: ResourceScope; q: ReturnType<typeof useFiles> }) {
  const { createFile, deleteFile } = useResourceMutations(scope);
  const { workspaceId } = useWorkspace();
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    try {
      for (const f of list) {
        const up = await uploadFile(f, scope.projectId ? "project_file" : "workspace_file", scope.projectId ?? workspaceId);
        await createFile.mutateAsync({ title: up.fileName, fileName: up.fileName, fileUrl: up.fileUrl, contentType: up.contentType, sizeBytes: up.sizeBytes });
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
      <List q={q} empty="Chưa có file">
        {(q.data ?? []).map((f) => (
          <Row key={f.id}>
            <IconFile size={14} className="shrink-0 text-ink-faint" />
            <a href={f.fileUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink hover:text-accent-ink">{f.title || f.fileName}</span>
              <span className="block truncate text-[11.5px] text-ink-faint">{fmtBytes(f.sizeBytes)} · {f.createdBy?.name} · {fmtRelative(f.updatedAt)}</span>
            </a>
            <IconButton label={`Xoá ${f.fileName}`} variant="ghost" size="sm" onClick={() => deleteFile.mutate(f.id, { onError: (e) => toast.error(e) })}><IconTrash size={13} /></IconButton>
          </Row>
        ))}
      </List>
      <div className="border-t border-line p-2">
        <input ref={ref} type="file" multiple className="sr-only" aria-label="Chọn file tải lên" onChange={(e) => onFiles(e.target.files)} />
        <Button size="sm" variant="ghost" loading={busy} onClick={() => ref.current?.click()}><IconPlus size={13} /> Tải file lên</Button>
      </div>
    </div>
  );
}
