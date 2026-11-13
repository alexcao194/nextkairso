"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TaskCommentResponse, WorkspaceMemberResponse } from "@/lib/api/schema";
import { collapseMentionTokens, expandMentionAliases, mentionsToMarkdown } from "@/lib/domain/mention";
import { fmtRelative } from "@/lib/domain/format";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { useToast } from "@/lib/toast/ToastProvider";
import { useCommentMutations, useTaskComments } from "@/lib/hooks/taskExtras";
import { fmtBytes, isImage, uploadFile, type UploadedFile } from "@/lib/upload";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { Textarea } from "@/components/ui/form";
import { MarkdownView } from "@/components/ui/MarkdownView";
import { useImagePaste } from "@/components/ui/useImagePaste";
import { Menu } from "@/components/ui/Popover";
import { useConfirm } from "@/components/ui/Confirm";
import { IconClose, IconEdit, IconFile, IconMore, IconPaperclip, IconSend, IconTrash } from "@/components/icons";
import { tr } from "@/lib/i18n";

export function AttachmentLink({ url, name, type, size }: { url: string; name: string; type?: string; size?: number }) {
  if (isImage(type, name)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} className="max-h-40 max-w-[220px] object-cover" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[12px] text-ink-2 hover:bg-hover">
      <IconFile size={13} className="shrink-0 text-ink-faint" />
      <span className="truncate">{name}</span>
      {size ? <span className="shrink-0 font-mono text-[11px] text-ink-faint">{fmtBytes(size)}</span> : null}
    </a>
  );
}

const commentImageUploader = (taskId: string) => async (f: File) => (await uploadFile(f, "task_comment_file", taskId)).fileUrl;

function CommentItem({ c, taskId, members }: { c: TaskCommentResponse; taskId: string; members: WorkspaceMemberResponse[] }) {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { edit, remove } = useCommentMutations(taskId);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const { handlers: pasteHandlers, pending } = useImagePaste(text, setText, commentImageUploader(taskId));
  const mine = c.authorId === user?.id;
  const edited = c.updatedAt !== c.createdAt;

  return (
    <li className="flex gap-2.5">
      <Avatar person={{ id: c.authorId, name: c.authorName, avatar: c.authorAvatar }} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-ink">{c.authorName ?? c.authorAlias}</span>
          <span className="text-[11.5px] text-ink-faint">{fmtRelative(c.createdAt)}</span>
          {edited && <span className="text-[11px] text-ink-faint">{tr().comments.edited}</span>}
          {mine && !editing && (
            <span className="ml-auto">
              <Menu
                align="end"
                trigger={({ ref, open: _o, ...p }) => (
                  <IconButton ref={ref} label={tr().comments.options} variant="ghost" size="sm" {...p}>
                    <IconMore size={14} />
                  </IconButton>
                )}
                items={[
                  { label: tr().comments.edit, icon: <IconEdit size={14} />, onSelect: () => (setText(collapseMentionTokens(c.content, members)), setEditing(true)) },
                  {
                    label: tr().comments.delete,
                    icon: <IconTrash size={14} />,
                    danger: true,
                    onSelect: async () => {
                      if (await confirm({ title: tr().comments.confirmDelete, message: tr().comments.cantUndo, danger: true })) {
                        remove.mutate(c.id, { onError: (e) => toast.error(e) });
                      }
                    },
                  },
                ]}
              />
            </span>
          )}
        </div>
        {editing ? (
          <div className="mt-1 flex flex-col gap-2">
            <Textarea aria-label={tr().comments.editLabel} value={text} onChange={(e) => setText(e.target.value)} rows={3} autoFocus {...pasteHandlers} />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                loading={edit.isPending}
                disabled={!text.trim() || pending > 0}
                onClick={() =>
                  edit.mutate(
                    { id: c.id, content: expandMentionAliases(text.trim(), members) },
                    { onSuccess: () => setEditing(false), onError: (e) => toast.error(e) },
                  )
                }
              >
                {tr().comments.save}
              </Button>
              <Button size="sm" onClick={() => setEditing(false)}>
                {tr().comments.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <MarkdownView source={c.content ? mentionsToMarkdown(c.content) : ""} className="kairso-md-comment mt-0.5" />
            {(c.attachments ?? []).length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-2">
                {c.attachments!.map((a) => (
                  <AttachmentLink key={a.id} url={a.fileUrl} name={a.fileName} type={a.contentType} size={a.sizeBytes} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
}

export function CommentList({ taskId }: { taskId: string }) {
  const { members } = useWorkspace();
  const q = useTaskComments(taskId);
  if (q.isLoading) return <div className="flex flex-col gap-3 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data?.length) return <EmptyState title={tr().comments.none} description={tr().comments.noneDesc} className="py-8" />;
  return (
    <ul className="flex flex-col gap-4 p-4">
      {q.data.map((c) => (
        <CommentItem key={c.id} c={c} taskId={taskId} members={members} />
      ))}
    </ul>
  );
}

export function CommentComposer({ taskId }: { taskId: string }) {
  const { members } = useWorkspace();
  const toast = useToast();
  const { add } = useCommentMutations(taskId);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState(0);
  const { handlers: pasteHandlers, pending } = useImagePaste(text, setText, commentImageUploader(taskId));

  const mention = useMemo(() => {
    const m = /(^|\s)@([a-zA-Z0-9_.\-]*)$/.exec(text.slice(0, cursor));
    return m ? { query: m[2].toLowerCase(), start: cursor - m[2].length - 1 } : null;
  }, [text, cursor]);
  const suggestions = mention
    ? members.filter((m) => `${m.userAlias} ${m.userName}`.toLowerCase().includes(mention.query)).slice(0, 5)
    : [];
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [mention?.query]);

  const pick = (m: WorkspaceMemberResponse) => {
    if (!mention) return;
    const next = `${text.slice(0, mention.start)}@${m.userAlias} ${text.slice(cursor)}`;
    setText(next);
    const pos = mention.start + m.userAlias.length + 2;
    requestAnimationFrame(() => {
      areaRef.current?.focus();
      areaRef.current?.setSelectionRange(pos, pos);
      setCursor(pos);
    });
  };

  const send = () => {
    if ((!text.trim() && files.length === 0) || add.isPending || pending > 0) return;
    add.mutate(
      {
        content: expandMentionAliases(text.trim(), members),
        attachments: files.map((f) => ({ fileName: f.fileName, fileUrl: f.fileUrl, contentType: f.contentType, sizeBytes: f.sizeBytes })),
      },
      { onSuccess: () => (setText(""), setFiles([])), onError: (e) => toast.error(e) },
    );
  };

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    try {
      const up = await Promise.all([...list].map((f) => uploadFile(f, "task_comment_file", taskId)));
      setFiles((p) => [...p, ...up]);
    } catch (e) {
      toast.error(e);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="relative border-t border-line bg-surface p-3">
      {suggestions.length > 0 && (
        <ul role="listbox" aria-label={tr().comments.suggestions} className="absolute inset-x-3 bottom-full z-30 mb-1 max-h-64 overflow-y-auto rounded-lg border border-line-strong bg-surface shadow-overlay">
          {suggestions.map((m, i) => (
            <li key={m.userId} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => (e.preventDefault(), pick(m))}
                className={`flex h-9 w-full items-center gap-2 px-2.5 text-left text-[13px] ${i === active ? "bg-accent-soft" : "hover:bg-hover"}`}
              >
                <Avatar person={{ id: m.userId, name: m.userName, avatar: m.userAvatar }} />
                <span className="truncate">{m.userName}</span>
                <span className="font-mono text-[11px] text-ink-faint">@{m.userAlias}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <span key={f.fileUrl} className="inline-flex items-center gap-1 rounded-md border border-line bg-hover px-2 py-0.5 text-[12px]">
              <span className="max-w-[160px] truncate">{f.fileName}</span>
              <button type="button" aria-label={tr().comments.removeFile(f.fileName)} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="text-ink-faint hover:text-ink">
                <IconClose size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <label htmlFor={`cmt-${taskId}`} className="sr-only">
          {tr().comments.write}
        </label>
        <Textarea
          id={`cmt-${taskId}`}
          ref={areaRef}
          rows={2}
          value={text}
          placeholder={tr().comments.writePh}
          onChange={(e) => (setText(e.target.value), setCursor(e.target.selectionStart))}
          onSelect={(e) => setCursor(e.currentTarget.selectionStart)}
          {...pasteHandlers}
          onKeyDown={(e) => {
            if (suggestions.length > 0) {
              if (e.key === "ArrowDown") return (e.preventDefault(), setActive((a) => (a + 1) % suggestions.length));
              if (e.key === "ArrowUp") return (e.preventDefault(), setActive((a) => (a - 1 + suggestions.length) % suggestions.length));
              if (e.key === "Enter" || e.key === "Tab") return (e.preventDefault(), pick(suggestions[active]));
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (e.preventDefault(), send());
          }}
          className="min-h-[52px] flex-1"
        />
        <input ref={fileRef} type="file" multiple className="sr-only" aria-label={tr().comments.attach} onChange={(e) => onFiles(e.target.files)} />
        <IconButton label={tr().comments.attach} onClick={() => fileRef.current?.click()} disabled={uploading}>
          <IconPaperclip size={15} />
        </IconButton>
        <Button variant="primary" onClick={send} loading={add.isPending} disabled={uploading || pending > 0 || (!text.trim() && files.length === 0)} aria-label={tr().comments.send}>
          <IconSend size={14} />
        </Button>
      </div>
    </div>
  );
}
